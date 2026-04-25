import { Box, Icon, Typography, useTheme } from "@mui/material";

import type { Msg } from "../../types/global";

function ChatBubble({ message, isGenerating }: { message: Msg; isGenerating: boolean }) {
    const theme = useTheme();
    const isUser = message.role === "user";

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
                        ? "rgba(209, 188, 255, 0.10)"
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
                    {isUser ? ("") : (<Box
                        component="span"
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Icon sx={{ fontSize: 15, color: theme.palette.primary.main }}>tokens</Icon>
                        Obi
                    </Box>)}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        color: theme.palette.text.primary,
                    }}
                >
                    {message.content || (!isUser && isGenerating ? "…" : "")}
                </Typography>
            </Box>
        </Box>
    );
}

export default ChatBubble;