import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SearchResult, Msg, LlamaStatus } from "./types/global";
import AppShell from "./components/layout/AppShell";
import SidebarNav, { type NavKey } from "./components/layout/SidebarNav";
import MainCanvas from "./components/layout/MainCanvas";
import EmptyState from "./components/ui/EmptyState";
import ChatThreadTopBar from "./components/chatThread/ChatThreadTopBar";

// Screens
import HomeScreen from "./components/screens/HomeScreen";
import ChatScreen from "./components/screens/ChatScreen";
import FilesScreen from "./components/screens/FilesScreen";
import VaultAppsScreen from "./components/screens/VaultAppsScreen";
import SettingsScreen from "./components/screens/SettingsScreen";
import PrivacyAboutScreen from "./components/screens/PrivacyAboutScreen";

const NAV_LABELS: Record<NavKey, string> = {
    home: 'Home',
    chat: 'Chat',
    files: 'Files',
    vault: 'Vault / Apps',
    history: 'History',
    settings: 'Settings',
    about: 'Privacy',
};

type AppProps = {
    selectedTheme: 'light' | 'dark';
    onToggleTheme: () => void;
};

function App({ selectedTheme, onToggleTheme }: AppProps) {
    /********************************************
    * Layout States
    ********************************************/
    const [sideNavActiveItem, setSideNavActiveItem] = useState<NavKey>('home');

    /********************************************
    * States
    - Chat Model
    - Embedding Model
    - File Watcher
    ********************************************/
    const [starting, setStarting] = useState(true);

    // Chat Model
    const [chatModelStatus, setChatModelStatus] = useState<LlamaStatus | null>(null);

    // Messages
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Msg[]>([
        { role: "system", content: "You are a helpful assistant. Use the search_files tool when additional context is needed." },
    ]);

    // Chat Stream
    const [lastRetrieved, setLastRetrieved] = useState<SearchResult[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const messagesRef = useRef<Msg[]>(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setStarting(true);
            setLastError(null);
            try {
                await window.llama.start();
                await window.api.embedder.start();
                const st: LlamaStatus = await window.llama.status();
                if (!mounted) return;
                setChatModelStatus(st);
            } catch (e: any) {
                if (!mounted) return;
                setLastError(String(e?.message ?? e));
                setChatModelStatus({ status: "error", port: 0, baseUrl: "", modelType: "" });
            } finally {
                if (mounted) setStarting(false);
            }
        })();

        const interval = setInterval(async () => {
            try {
                const st: LlamaStatus = await window.llama.status();
                if (mounted) setChatModelStatus(st);
            } catch {
                // ignore
            }
        }, 1500);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const stop = () => {
        try {
            window.llama.chatStreamCancel?.();
        } catch {
            // ignore
        }
        setIsGenerating(false);
    };

    const send = async () => {
        const content = input.trim();
        if (!content || isGenerating) return;

        setLastError(null);
        setInput("");

        const userMsg: Msg = { role: "user", content };
        const history = messagesRef.current;

        setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);

        const requestId =
            (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

        setIsGenerating(true);

        let ragResults: SearchResult[] = [];
        let augmentedContent = content;

        try {
            ragResults = await window.api.rag.search(content, 5);
            setLastRetrieved(ragResults);
            const ragPrefix = buildRagContextPrefix(ragResults);
            if (ragPrefix) augmentedContent = ragPrefix + content;
        } catch (e) {
            console.error("RAG search failed:", e);
            setLastError(`RAG search failed: ${String((e as Error)?.message ?? e)}`);
        }

        const augmentedUserMsg: Msg = { role: "user", content: augmentedContent };
        const nextMessages = [...history, augmentedUserMsg];

        const offDelta = window.llama.onChatStreamDelta?.((payload: any) => {
            if (payload?.requestId !== requestId) return;
            const delta = String(payload?.delta ?? "");
            if (!delta) return;

            setMessages((prev) => {
                const i = prev.length - 1;
                const last = prev[i];
                if (!last || last.role !== "assistant") return prev;

                const next = prev.slice();
                next[i] = { ...last, content: last.content + delta };
                return next;
            });
        });

        const cleanup = () => {
            try { offDelta?.(); } catch { }
            try { offDone?.(); } catch { }
            try { offErr?.(); } catch { }
        };

        const offDone = window.llama.onChatStreamDone?.((payload: any) => {
            if (payload?.requestId !== requestId) return;
            setIsGenerating(false);
            cleanup();
        });

        const offErr = window.llama.onChatStreamError?.((payload: any) => {
            if (payload?.requestId !== requestId) return;
            setIsGenerating(false);
            setLastError(String(payload?.error ?? "Unknown error"));
            setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant" && !last.content) {
                    last.content = `⚠️ ${String(payload?.error ?? "Unknown error")}`;
                    return copy;
                }
                return [...copy, { role: "assistant", content: `⚠️ ${String(payload?.error ?? "Unknown error")}` }];
            });
            cleanup();
        });

        try {
            if (!window.llama.chatStreamStart) {
                throw new Error("Streaming API not available on window.llama");
            }
            window.llama.chatStreamStart({
                requestId,
                messages: nextMessages,
            });
        } catch (e: any) {
            setIsGenerating(false);
            setLastError(String(e?.message ?? e));
            cleanup();
        }
    };

    const buildRagContextPrefix = (results: SearchResult[]): string => {
        if (!results.length) return "";

        const context = results
            .map((r, i) =>
                [
                    `Source ${i + 1}: ${r.fileName}`,
                    `Path: ${r.documentPath}`,
                    `Content: ${r.content}`,
                ].join("\n")
            )
            .join("\n\n---\n\n");

        return (
            "Use the retrieved context below to answer the question. " +
            "Prefer this context when relevant; say so plainly if it is insufficient.\n\n" +
            context +
            "\n\n---\n\nQuestion: "
        );
    };

    // Navigate to chat and optionally pre-fill the input
    const navigateToChat = (query?: string) => {
        setSideNavActiveItem('chat');
        if (query) setInput(query);
    };

    const renderCanvasContent = () => {
        switch (sideNavActiveItem) {
            case 'home':
                return <HomeScreen onNavigateToChat={navigateToChat} />;

            case 'vault':
                return <VaultAppsScreen />;

            case 'history':
                return (
                    <EmptyState
                        icon="history"
                        title="No history yet"
                        description="Your conversation history will appear here in a future update."
                    />
                );

            case 'settings':
                return (
                    <SettingsScreen
                        selectedTheme={selectedTheme}
                        onToggleTheme={onToggleTheme}
                    />
                );

            case 'about':
                return <PrivacyAboutScreen />;

            default:
                return null;
        }
    };

    const renderScreen = () => {
        if (sideNavActiveItem === 'chat') {
            return (
                <ChatScreen
                    starting={starting}
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    send={send}
                    stop={stop}
                    isGenerating={isGenerating}
                    lastError={lastError}
                    lastRetrieved={lastRetrieved}
                    onNavigateToChat={navigateToChat}
                />
            );
        }

        if (sideNavActiveItem === 'files') {
            return <FilesScreen onNavigateToChat={navigateToChat} />;
        }

        return (
            <MainCanvas
                contentMaxWidth="100%"
                canvasContent={renderCanvasContent()}
            />
        );
    };

    const renderMainContent = () => {
        const isHome = sideNavActiveItem === 'home';
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* Global top bar — hidden on home screen */}
                {!isHome && (
                    <Box
                        sx={(theme) => ({
                            height: 56,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            px: 4,
                            borderBottom: `1px solid ${theme.palette.outline.variant}`,
                            backdropFilter: 'blur(12px)',
                        })}
                    >
                        <ChatThreadTopBar
                            starting={starting}
                            chatModelStatus={chatModelStatus}
                            homeLabel="Home"
                            sessionLabel={NAV_LABELS[sideNavActiveItem]}
                            statusLabel={chatModelStatus?.status ?? 'unknown'}
                            onHomeClick={() => setSideNavActiveItem('home')}
                        />
                    </Box>
                )}
                {renderScreen()}
            </Box>
        );
    };

    return (
        <AppShell
            sideBar={
                <SidebarNav
                    activeItem={sideNavActiveItem}
                    onSelect={setSideNavActiveItem}
                    onNewChat={() => setSideNavActiveItem('chat')}
                    selectedTheme={selectedTheme}
                    onThemeChange={onToggleTheme}
                />
            }
            mainCanvas={renderMainContent()}
        />
    );
}

export default App;
