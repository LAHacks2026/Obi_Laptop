import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { Msg, SearchResult } from "../../types/global";
import ChatTheadContent from "../chatThread/ChatTheadContent";
import FileResultsPanel from "../ui/FileResultsPanel";
import FilePreviewPanel from "../ui/FilePreviewPanel";

type ChatScreenProps = {
    starting: boolean;
    messages: Msg[];
    input: string;
    setInput: (value: string) => void;
    send: () => void;
    stop: () => void;
    isGenerating: boolean;
    lastError: string | null;
    lastRetrieved: SearchResult[];
    onNavigateToChat: (query?: string) => void;
};

export default function ChatScreen({
    starting,
    messages,
    input,
    setInput,
    send,
    stop,
    isGenerating,
    lastError,
    lastRetrieved,
    onNavigateToChat,
}: ChatScreenProps) {
    const theme = useTheme();
    const [selectedFile, setSelectedFile] = useState<SearchResult | null>(null);
    const [panelDismissed, setPanelDismissed] = useState(false);

    // Reset panel state when new results come in
    useEffect(() => {
        if (lastRetrieved.length > 0) {
            setPanelDismissed(false);
            setSelectedFile(null);
        }
    }, [lastRetrieved]);

    const showPanel = lastRetrieved.length > 0 && !panelDismissed;

    const handleAskObi = (query: string) => {
        setSelectedFile(null);
        setPanelDismissed(true);
        onNavigateToChat(query);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
            }}
        >
            {/* Main content */}
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                }}
            >
                {/* Chat column */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minWidth: 0,
                        minHeight: 0,
                    }}
                >
                    <ChatTheadContent
                        messages={messages}
                        lastError={lastError}
                        lastRetrieved={lastRetrieved}
                        input={input}
                        setInput={setInput}
                        send={send}
                        stop={stop}
                        isGenerating={isGenerating}
                        starting={starting}
                    />
                </Box>

                {/* File panel */}
                {showPanel && (
                    <Box
                        sx={{
                            width: 360,
                            flexShrink: 0,
                            borderLeft: `1px solid ${theme.palette.outline.variant}`,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {selectedFile ? (
                            <FilePreviewPanel
                                result={selectedFile}
                                onBack={() => setSelectedFile(null)}
                                onAskObi={handleAskObi}
                            />
                        ) : (
                            <FileResultsPanel
                                results={lastRetrieved}
                                selectedId={selectedFile?.chunkId ?? null}
                                onSelect={setSelectedFile}
                                onAskObi={handleAskObi}
                                onClose={() => setPanelDismissed(true)}
                            />
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
