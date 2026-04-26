import { Box, Button, Icon, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EmptyState from "../ui/EmptyState";

type HistorySession = {
    id: string;
    title: string;
    createdAtMs: number;
    updatedAtMs: number;
    messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>;
};

type HistoryScreenProps = {
    sessions: HistorySession[];
    activeSessionId: string | null;
    onOpenSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onClearAll: () => void;
};

export default function HistoryScreen({
    sessions,
    activeSessionId,
    onOpenSession,
    onDeleteSession,
    onClearAll,
}: HistoryScreenProps) {
    const theme = useTheme();

    if (!sessions.length) {
        return (
            <EmptyState
                icon="history"
                title="No history yet"
                description="Start chatting and your conversations will appear here."
            />
        );
    }

    return (
        <Box sx={{ height: "100%", overflowY: "auto" }}>
            <Box sx={{ px: 4, py: 3, maxWidth: 960, mx: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: "-0.02em" }}>
                            History
                        </Typography>
                        <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem" }}>
                            {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Icon>delete_sweep</Icon>}
                        onClick={onClearAll}
                    >
                        Clear All
                    </Button>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {sessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        const preview = getPreview(session.messages);
                        const updatedAt = new Date(session.updatedAtMs).toLocaleString();
                        return (
                            <Box
                                key={session.id}
                                sx={{
                                    border: `1px solid ${isActive ? theme.palette.primary.main : theme.palette.outline.variant}`,
                                    backgroundColor: isActive ? theme.palette.surface.high : theme.palette.surface.mid,
                                    borderRadius: 1.5,
                                    p: 1.5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                        {session.title}
                                    </Typography>
                                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.78rem", mt: 0.25 }}>
                                        {preview}
                                    </Typography>
                                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem", mt: 0.5 }}>
                                        Updated {updatedAt}
                                    </Typography>
                                </Box>
                                <Button size="small" variant="contained" onClick={() => onOpenSession(session.id)}>
                                    Open
                                </Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDeleteSession(session.id)}
                                    aria-label="Delete conversation"
                                >
                                    <Icon fontSize="small">delete</Icon>
                                </IconButton>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
}

function getPreview(messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>): string {
    const firstAssistant = messages.find((message) => message.role === "assistant" && message.content.trim());
    const firstUser = messages.find((message) => message.role === "user" && message.content.trim());
    const base = firstAssistant?.content || firstUser?.content || "No preview available";
    const normalized = base.replace(/\s+/g, " ").trim();
    if (normalized.length <= 120) return normalized;
    return `${normalized.slice(0, 120).trimEnd()}…`;
}
