import { Box, Icon, Typography, useTheme } from "@mui/material";
import { keyframes } from "@mui/system";
import type { ReactNode } from "react";
import type { Msg } from "../../types/global";

const bounce = keyframes`
    0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
    40%            { transform: translateY(-5px); opacity: 1; }
`;

function TypingDots() {
    const theme = useTheme();
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, py: 0.5 }}>
            {[0, 1, 2].map((i) => (
                <Box
                    key={i}
                    sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.main,
                        animation: `${bounce} 1.2s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                    }}
                />
            ))}
        </Box>
    );
}

function ChatBubble({ message, isGenerating }: { message: Msg; isGenerating: boolean }) {
    const theme = useTheme();
    const isUser = message.role === "user";
    const isWaiting = !isUser && !message.content && isGenerating;

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
            }}
        >
            <Box
                sx={{
                    maxWidth: { xs: "92%", md: "78%" },
                    px: 1.75,
                    py: 1.4,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.outline.variant}`,
                    backgroundColor: isUser
                        ? theme.palette.action.selected
                        : theme.palette.surface.mid,
                    backdropFilter: "blur(10px)",
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        color: isUser ? "" : theme.palette.text.secondary,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                    }}
                >
                    {isUser ? ("") : (
                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                            <Icon sx={{ fontSize: 15, color: theme.palette.primary.main }}>tokens</Icon>
                            Obi
                        </Box>
                    )}
                </Typography>

                {isWaiting ? (
                    <TypingDots />
                ) : (
                    <Box
                        sx={{
                            lineHeight: 1.6,
                            color: theme.palette.text.primary,
                        }}
                    >
                        {renderMessageContent(message.content)}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default ChatBubble;

function renderMessageContent(content: string): ReactNode {
    const lines = content.split("\n");
    return lines.map((rawLine, index) => {
        const bulletMatch = rawLine.match(/^\s*[*-]\s+(.*)$/);
        const line = bulletMatch ? bulletMatch[1] : rawLine;
        const parts = renderInlineBold(line);

        return (
            <Box
                key={`line-${index}`}
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: bulletMatch ? 0.9 : 0,
                    minHeight: "1.5em",
                }}
            >
                {bulletMatch ? (
                    <Typography
                        component="span"
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            lineHeight: 1.6,
                            width: "0.9em",
                            flexShrink: 0,
                            mt: 0.02,
                        }}
                    >
                        •
                    </Typography>
                ) : null}
                <Typography
                    component="span"
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, flex: 1 }}
                >
                    {parts.length > 0 ? parts : "\u00A0"}
                </Typography>
            </Box>
        );
    });
}

function renderInlineBold(line: string): ReactNode[] {
    const result: ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
        if (match.index > cursor) {
            result.push(line.slice(cursor, match.index));
        }
        result.push(
            <Box component="strong" key={`bold-${match.index}`}>
                {match[1]}
            </Box>
        );
        cursor = regex.lastIndex;
    }

    if (cursor < line.length) {
        result.push(line.slice(cursor));
    }
    return result;
}
