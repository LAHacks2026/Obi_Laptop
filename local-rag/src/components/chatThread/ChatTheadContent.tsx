import { useEffect, useMemo, useRef } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    Icon,
    Stack,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import type { Msg, SearchResult } from "../../types/global";

import PromptCard from "./PromptCard";
import ChatBubble from "./ChatBubble";

type ChatThreadContentProps = {
    messages: Msg[];
    lastError: string | null;
    lastRetrieved: SearchResult[];
    input: string;
    setInput: (value: string) => void;
    send: () => void;
    stop: () => void;
    isGenerating: boolean;
    chatModelReady: boolean;
    starting: boolean;
};

function ChatThreadContent({
    messages,
    lastError,
    lastRetrieved,
    input,
    setInput,
    send,
    stop,
    isGenerating,
    chatModelReady,
    starting,
}: ChatThreadContentProps) {
    const theme = useTheme();
    const visibleMessages = useMemo(() => messages.filter((m) => m.role !== "system"), [messages]);
    const hasConversation = visibleMessages.length > 0;
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!hasConversation) return;

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [visibleMessages.length, isGenerating, hasConversation]);

    const suggestionPrompts = [
        "What causes a false burrow alert at South Lintel?",
        "What's the weather in LA?",
        "Which site is most affected by trench-driven salinity pulses in Needle Rain season?",
    ];

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
            }}
        >

            {/* Prompt Card and Messages Wrapper */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 1,
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    maxWidth: 980,
                    mx: "auto",
                    px: { xs: 2, md: 3 },
                    pt: { xs: 2, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: hasConversation ? "flex-start" : "center",
                    overflow: "auto",
                }}
            >
                {lastError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {lastError}
                    </Alert>
                )}

                {!hasConversation ? (
                    // Prompt Cards
                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: 760,
                            mx: "auto",
                            textAlign: "center",
                            py: { xs: 4, md: 8 },
                        }}
                    >
                        <Box
                            sx={{
                                mb: 3,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 2,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.outline.variant}`,
                                backgroundColor: theme.palette.surface.high,
                            }}
                        >
                            <Icon sx={{ fontSize: 50, color: theme.palette.primary.main }}>tokens</Icon>
                        </Box>

                        <Typography
                            sx={{
                                fontSize: { xs: 34, md: 56 },
                                lineHeight: 1.05,
                                fontWeight: 700,
                                letterSpacing: "-0.03em",
                                mb: 2,
                            }}
                        >
                            Hi Obi.{" "}
                            <Box component="span" sx={{ color: "rgba(209, 188, 255, 0.8)" }}>
                                What's in my vault?
                            </Box>
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                maxWidth: 560,
                                mx: "auto",
                                color: theme.palette.text.secondary,
                                lineHeight: 1.75,
                                mb: 5,
                                fontSize: { xs: 15, md: 18 },
                            }}
                        >
                            Your data, processed on your local hardware.
                        </Typography>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                                gap: 2,
                                textAlign: "left",
                            }}
                        >
                            <PromptCard
                                icon={<Icon>stars_2</Icon>}
                                title="Synthesize my notes"
                                body={suggestionPrompts[0]}
                                onClick={() => setInput(suggestionPrompts[0])}
                            />
                            <PromptCard
                                icon={<Icon>terminal</Icon>}
                                title="Audit security logs"
                                body={suggestionPrompts[1]}
                                onClick={() => setInput(suggestionPrompts[1])}
                            />
                            <PromptCard
                                icon={<Icon>inventory_2</Icon>}
                                title='Deep search: "Zero-Knowledge Proofs"'
                                body={suggestionPrompts[2]}
                                wide
                                onClick={() => setInput(suggestionPrompts[2])}
                            />
                        </Box>
                    </Box>
                ) : (
                    // Chat Messages
                    <Stack
                        spacing={1.25}
                        sx={{
                            p: 2,
                            width: '100%',
                            mt: 1,
                        }}
                    >
                        {visibleMessages.map((m, i) => (
                            <ChatBubble key={i} message={m} isGenerating={isGenerating} />
                        ))}
                        <Box ref={messagesEndRef} />
                    </Stack>
                )}
            </Box>

            {/* Composer */}
            <Box
                sx={{
                    flexShrink: 0,
                    zIndex: 1,
                    width: "100%",
                    maxWidth: 980,
                    mx: "auto",
                    px: { xs: 2, md: 3 },
                    pb: { xs: 3, md: 4 },
                    pt: 2,
                    backgroundColor: "transparent",
                }}
            >
                <Box sx={{ position: "relative", backgroundColor: "transparent", }}>
                    <Box
                        sx={{
                            inset: 0,
                            borderRadius: 3,
                            pointerEvents: "none",
                            backgroundColor: "transparent",
                        }}
                    />
                    <Card
                        variant="outlined"
                        sx={{
                            position: "relative",
                            overflow: "hidden",
                            backgroundColor: theme.palette.background.default,
                            border: "0.75px solid",
                            borderColor: theme.palette.primary.contrastText,
                            borderRadius: 3,
                        }}
                    >
                        {/* Attachment and Canvas Buttons */}
                        <Box
                            sx={{
                                px: 2,
                                py: 1.25,
                                borderBottom: `0.5px solid ${theme.palette.divider}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                flexWrap: "wrap",
                            }}
                        >
                            <Button
                                variant="text"
                                startIcon={<Icon sx={{ fontSize: 18 }}>attach_file</Icon>}
                                sx={{
                                    minWidth: 0,
                                    p: 0,
                                    color: theme.palette.text.secondary,
                                    textTransform: "none",
                                    justifyContent: "flex-start",
                                    fontSize: 10,
                                    letterSpacing: "0.08em",
                                    fontFamily: `'Space Grotesk', sans-serif`,
                                    "& .MuiButton-startIcon": {
                                        mr: 0.75,
                                    },
                                    "& .MuiSvgIcon-root, & .MuiIcon-root": {
                                        fontSize: 18,
                                    },
                                    "&:hover": {
                                        backgroundColor: "transparent",
                                        color: theme.palette.primary.main,
                                    },
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        textTransform: "uppercase",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Reference Vault
                                </Box>
                            </Button>

                            <Button
                                variant="text"
                                startIcon={<Icon sx={{ fontSize: 18 }}>image</Icon>}
                                sx={{
                                    minWidth: 0,
                                    p: 0,
                                    color: theme.palette.text.secondary,
                                    textTransform: "none",
                                    justifyContent: "flex-start",
                                    fontSize: 10,
                                    letterSpacing: "0.08em",
                                    fontFamily: `'Space Grotesk', sans-serif`,
                                    "& .MuiButton-startIcon": {
                                        mr: 0.75,
                                    },
                                    "& .MuiSvgIcon-root, & .MuiIcon-root": {
                                        fontSize: 18,
                                    },
                                    "&:hover": {
                                        backgroundColor: "transparent",
                                        color: theme.palette.primary.main,
                                    },
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        textTransform: "uppercase",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Canvas
                                </Box>
                            </Button>
                        </Box>

                        {/* Retrieved Documents */}
                        {lastRetrieved.length > 0 && (
                            <Box
                                sx={{
                                    px: 2,
                                    pt: 1.5,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.75,
                                }}
                            >
                                {lastRetrieved.map((r) => (
                                    <Chip
                                        key={r.chunkId}
                                        size="small"
                                        variant="outlined"
                                        label={`${r.fileName} · ${r.distance.toFixed(2)}`}
                                        sx={{
                                            maxWidth: 220,
                                            height: 24,
                                            backgroundColor: "transparent",
                                            borderColor: theme.palette.outline.variant,
                                            "& .MuiChip-label": {
                                                px: 1,
                                                fontSize: 11,
                                                color: theme.palette.text.secondary,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            },
                                        }}
                                    />
                                ))}
                            </Box>
                        )}

                        {/* Text Field & Send/Stop Button */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 1.5,
                                p: 2,
                            }}
                        >
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                maxRows={8}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Describe your query..."
                                disabled={!chatModelReady || starting}
                                variant="outlined"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && !(e as any).isComposing) {
                                        e.preventDefault();
                                        send();
                                    }
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        backgroundColor: "transparent",
                                        borderRadius: 2,
                                        alignItems: "flex-start",
                                        "& fieldset": {
                                            borderColor: "transparent",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "transparent",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "transparent",
                                        },
                                    },
                                    "& textarea": {
                                        py: 0.5,
                                    },
                                }}
                            />

                            {/* Stop Start Circle */}
                            {isGenerating ? (
                                <Button
                                    variant="contained"
                                    onClick={stop}
                                    disabled={!chatModelReady || starting}
                                    sx={{
                                        minWidth: 44,
                                        width: 44,
                                        height: 44,
                                        borderRadius: 2,
                                        p: 0,
                                    }}
                                >
                                    <Icon>stop_circle</Icon>
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={send}
                                    disabled={
                                        !chatModelReady || starting || isGenerating || !input.trim()
                                    }
                                    sx={{
                                        minWidth: 44,
                                        width: 44,
                                        height: 44,
                                        borderRadius: 2,
                                        p: 0,
                                    }}
                                >
                                    <Icon>arrow_forward</Icon>
                                </Button>
                            )}
                        </Box>

                        <Box
                            sx={{
                                px: 1,
                                py: 1,
                                borderTop: `1px solid ${theme.palette.divider}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                flexWrap: "wrap",
                            }}
                        >
                            <Stack direction="row" spacing={0.75} alignItems="center">
                                <Icon sx={{ fontSize: 16 }}>lock</Icon>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: 10,
                                        color: theme.palette.text.secondary,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    End-to-End Encrypted Session
                                </Typography>
                            </Stack>

                            <Typography
                                variant="caption"
                                sx={{
                                    color: theme.palette.text.disabled,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {isGenerating ? "Generating…" : "Tokens: 0/32k"}
                            </Typography>
                        </Box>
                    </Card>
                </Box>

                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        textAlign: "center",
                        mt: 1.5,
                        color: "rgba(172,171,170,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                    }}
                >
                    Obi is local. Your data never leaves this machine.
                </Typography>
            </Box>
        </Box>
    );
}

export default ChatThreadContent;