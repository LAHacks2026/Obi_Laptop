import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
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

const MAX_IMAGE_CAPTIONS_PER_QUERY = 3;
const MAX_VISUAL_QA_IMAGES = 2;
const MAX_OCR_TEXT_CHARS = 320;
const MIN_OCR_TEXT_LEN = 4;
const DEBUG_IMAGE_TEXT_ROUTING = true;

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
        {
            role: "system",
            content:
                "You are a helpful assistant for local RAG. " +
                "Always ground answers in retrieved context when available. " +
                "When retrieved image captions are present, treat them as visual observations. " +
                "When OCR text is present, treat it as extracted text from the image. " +
                "Do not say you cannot see images if caption context is provided.",
        },
    ]);

    // Chat Stream
    const [lastRetrieved, setLastRetrieved] = useState<SearchResult[]>([]);
    const [lastImageResults, setLastImageResults] = useState<SearchResult[]>([]);
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

    const handleSelectNav = (item: NavKey) => {
        // Safety valve: never leave chat controls locked when navigating.
        if (item === "chat" && isGenerating) {
            stop();
        }
        setSideNavActiveItem(item);
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
        let directImageTextAnswer: string | null = null;

        try {
            ragResults = await window.api.rag.search(content, 5);
            ragResults = prioritizeExplicitImageFile(content, ragResults);
            ragResults = prioritizeForVisualIntent(content, ragResults);
            ragResults = await enrichImageResultsWithCaptions(ragResults);
            setLastRetrieved(ragResults);
            const imageResults = ragResults.filter((result) => result.modality === "image");
            if (imageResults.length) {
                setLastImageResults(imageResults);
            }
            directImageTextAnswer = await buildDirectImageTextAnswer(content, imageResults);
            if (directImageTextAnswer) {
                setMessages((prev) => {
                    const next = prev.slice();
                    const i = next.length - 1;
                    if (i >= 0 && next[i].role === "assistant") {
                        next[i] = { ...next[i], content: directImageTextAnswer ?? "" };
                    }
                    return next;
                });
                setIsGenerating(false);
                return;
            }
            const visualQaContext = await buildVisualQaContext(content, imageResults);
            if (visualQaContext) {
                augmentedContent = `${visualQaContext}\n\n${augmentedContent}`;
            }
            const ragPrefix = buildRagContextPrefix(ragResults);
            if (ragPrefix) augmentedContent = ragPrefix + augmentedContent;
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

        const safetyTimeout = setTimeout(() => {
            setIsGenerating(false);
        }, 45000);

        const cleanup = () => {
            clearTimeout(safetyTimeout);
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

    const buildDirectImageTextAnswer = async (
        question: string,
        imageResults: SearchResult[]
    ): Promise<string | null> => {
        const asksForText = isTextInImageQuestion(question);
        if (!asksForText) return null;
        if (!imageResults.length) {
            return "I could not find an image match for that text-extraction request in the retrieved context. Try including the exact filename (for example, `3630.FloatingFigure.png`) or re-index the folder containing the image.";
        }

        const target = pickBestImageByQuery(question, imageResults);
        if (!target) {
            return "I found image results, but could not confidently match one to your text-extraction request. Try using the exact filename.";
        }
        if (DEBUG_IMAGE_TEXT_ROUTING) {
            console.info("[image-text] selected target:", {
                question,
                fileName: target.fileName,
                documentPath: target.documentPath,
                candidateCount: imageResults.length,
            });
        }

        const ocrRaw = await window.api.rag.extractImageText(target.documentPath).catch(() => "");
        if (DEBUG_IMAGE_TEXT_ROUTING) {
            console.info("[image-text] OCR raw output:", {
                fileName: target.fileName,
                rawLength: ocrRaw.length,
                rawPreview: ocrRaw.slice(0, 200),
            });
        }
        const ocr = normalizeOcrText(ocrRaw);
        if (ocr) {
            return `I found text in \`${target.fileName}\`:\n\n${ocr}`;
        }
        return `I could not detect reliable readable text in \`${target.fileName}\` with the current local OCR model. Try a clearer/higher-resolution image or tighter crop around the text.`;
    };

    const enrichImageResultsWithCaptions = async (results: SearchResult[]): Promise<SearchResult[]> => {
        const imageTargets = results
            .filter((result) => result.modality === "image")
            .slice(0, MAX_IMAGE_CAPTIONS_PER_QUERY);

        if (!imageTargets.length) return results;

        const descriptionByPath = new Map<string, string>();
        const ocrTextByPath = new Map<string, string>();
        const objectLabelsByPath = new Map<string, string[]>();
        await Promise.all(
            imageTargets.map(async (imageResult) => {
                try {
                    const caption = await window.api.rag.describeImage(imageResult.documentPath);
                    if (caption?.trim()) {
                        descriptionByPath.set(imageResult.documentPath, caption.trim());
                    }
                } catch (error) {
                    console.warn("Image caption failed for:", imageResult.documentPath, error);
                }
                try {
                    const ocrText = await window.api.rag.extractImageText(imageResult.documentPath);
                    if (ocrText?.trim()) {
                        ocrTextByPath.set(imageResult.documentPath, ocrText.trim());
                    }
                } catch (error) {
                    console.warn("OCR failed for:", imageResult.documentPath, error);
                }
                try {
                    const labels = await window.api.rag.detectImageObjects(imageResult.documentPath);
                    if (Array.isArray(labels) && labels.length) {
                        objectLabelsByPath.set(imageResult.documentPath, labels);
                    }
                } catch (error) {
                    console.warn("Object detection failed for:", imageResult.documentPath, error);
                }
            })
        );

        if (!descriptionByPath.size && !ocrTextByPath.size && !objectLabelsByPath.size) return results;

        return results.map((result) => {
            const caption = descriptionByPath.get(result.documentPath);
            const ocrText = ocrTextByPath.get(result.documentPath);
            const labels = objectLabelsByPath.get(result.documentPath) ?? [];
            if (!caption && !ocrText && !labels.length) return result;

            const normalizedOcr = normalizeOcrText(ocrText ?? "");
            const ocrLine = normalizedOcr
                ? `\nOCR: ${normalizedOcr.slice(0, MAX_OCR_TEXT_CHARS)}${normalizedOcr.length > MAX_OCR_TEXT_CHARS ? "..." : ""}`
                : "";
            const objectLine = labels.length ? `\nObjects: ${labels.join(", ")}` : "";
            return {
                ...result,
                content: `[image] ${result.fileName}${caption ? `\nCaption: ${caption}` : ""}${objectLine}${ocrLine}`,
            };
        });
    };

    const buildVisualQaContext = async (
        question: string,
        imageResults: SearchResult[]
    ): Promise<string> => {
        if (!isVisualQuestion(question)) return "";

        const candidates = imageResults.length
            ? imageResults
            : lastImageResults;
        if (!candidates.length) return "";

        const targets = candidates.slice(0, MAX_VISUAL_QA_IMAGES);
        const answers = await Promise.all(
            targets.map(async (target) => {
                try {
                    const answer = await window.api.rag.answerImageQuestion(target.documentPath, question);
                    return {
                        fileName: target.fileName,
                        documentPath: target.documentPath,
                        answer,
                    };
                } catch (error) {
                    console.warn("Visual QA failed for:", target.documentPath, error);
                    return null;
                }
            })
        );

        const successful = answers.filter(Boolean) as Array<{
            fileName: string;
            documentPath: string;
            answer: string;
        }>;
        if (!successful.length) return "";

        const lines = successful.map((item, index) =>
            `Visual QA ${index + 1}: ${item.fileName}\nPath: ${item.documentPath}\nAnswer: ${item.answer}`
        );
        return `Use these visual QA answers as primary evidence for image-specific details.\n\n${lines.join("\n\n")}`;
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
            "Prefer this context when relevant; if image captions are included, treat them as visual evidence. " +
            "If OCR lines are included, treat them as text extracted from images. " +
            "Say plainly if context is insufficient.\n\n" +
            context +
            "\n\n---\n\nQuestion: "
        );
    };

    // Navigate to chat and optionally pre-fill the input
    const navigateToChat = (query?: string) => {
        if (isGenerating) stop();
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
                    onSelect={handleSelectNav}
                    onNewChat={() => handleSelectNav('chat')}
                    selectedTheme={selectedTheme}
                    onThemeChange={onToggleTheme}
                />
            }
            mainCanvas={renderMainContent()}
        />
    );
}

export default App;

function isVisualQuestion(question: string): boolean {
    const normalized = question.toLowerCase();
    return [
        "image",
        "photo",
        "picture",
        "color",
        "colour",
        "what is",
        "what's",
        "can you see",
        "describe",
        "object",
        "dog",
        "cat",
        "apple",
        "person",
        "in this",
    ].some((token) => normalized.includes(token));
}

function prioritizeExplicitImageFile(query: string, results: SearchResult[]): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const explicitName = getExplicitImageFilename(query)?.toLowerCase();
    const asksForImageText = isTextInImageQuestion(lowerQuery);
    const imageResults = results.filter((result) => result.modality === "image");
    const likelyImageReference = isLikelyImageReferenceQuery(query, imageResults);
    if (!explicitName && !asksForImageText && !likelyImageReference) return results;
    if (!imageResults.length) return results;

    const best = pickBestImageByQuery(query, imageResults);
    if (!best) return results;
    const exact = [best];
    if (!asksForImageText) return [...exact, ...results.filter((r) => r.documentPath !== best.documentPath)];

    // For OCR-style questions, keep only the best-matching image to avoid context pollution.
    return exact;
}

function prioritizeForVisualIntent(query: string, results: SearchResult[]): SearchResult[] {
    if (!isVisualQuestion(query)) return results;
    const imageResults = results.filter((result) => result.modality === "image");
    if (!imageResults.length) return results;
    // For image-centric prompts, keep context image-first and avoid text-file pollution.
    return imageResults;
}

function normalizeOcrText(text: string): string {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length < MIN_OCR_TEXT_LEN) return "";
    if (/^[A-Z0-9]{1,3}$/.test(normalized)) return "";
    return normalized;
}

function getExplicitImageFilename(query: string): string | null {
    return query.match(/([A-Za-z0-9._-]+\.(?:png|jpe?g|webp|gif))/i)?.[1] ?? null;
}

function isTextInImageQuestion(text: string): boolean {
    return /text|ocr|read|word|sentence|letters|written/.test(text.toLowerCase());
}

function normalizeForFilenameMatch(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isLikelyImageReferenceQuery(query: string, imageResults: SearchResult[]): boolean {
    if (!imageResults.length) return false;
    const hasNumericAnchor = /\b\d{2,}\b/.test(query);
    const normalizedQuery = normalizeForFilenameMatch(query);
    if (!normalizedQuery) return false;
    if (hasNumericAnchor) return true;

    return imageResults.some((result) => {
        const base = result.fileName.replace(/\.[^.]+$/, "");
        const normalizedBase = normalizeForFilenameMatch(base);
        return (
            normalizedBase.length >= 6 &&
            (normalizedQuery.includes(normalizedBase) || normalizedBase.includes(normalizedQuery))
        );
    });
}

function pickBestImageByQuery(query: string, imageResults: SearchResult[]): SearchResult | null {
    if (!imageResults.length) return null;

    const explicitName = getExplicitImageFilename(query);
    if (explicitName) {
        const explicitNormalized = normalizeForFilenameMatch(explicitName);
        const exact = imageResults.find(
            (result) => normalizeForFilenameMatch(result.fileName) === explicitNormalized
        );
        if (exact) return exact;
    }

    const queryNormalized = normalizeForFilenameMatch(query);
    const scored = imageResults
        .map((result) => {
            const base = result.fileName.replace(/\.[^.]+$/, "");
            const candidate = normalizeForFilenameMatch(base);
            const starts = queryNormalized.includes(candidate) || candidate.includes(queryNormalized);
            const overlap = candidate
                .split(/(?=[0-9])|(?<=[0-9])/)
                .filter(Boolean)
                .reduce((count, token) => count + (queryNormalized.includes(token) ? 1 : 0), 0);
            const score = (starts ? 1000 : 0) + overlap + (candidate.length > 0 && queryNormalized.includes(candidate) ? 50 : 0);
            return { result, score };
        })
        .sort((a, b) => b.score - a.score);

    return scored[0]?.score > 0 ? scored[0].result : imageResults[0];
}
