import { Box, Button, CircularProgress, Icon, IconButton, Tooltip, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useState } from "react";

function FileWatcherPicker() {
    const theme = useTheme();
    const [watchedPath, setWatchedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{
        scanned: number;
        indexed: number;
        skipped: number;
        textIndexed: number;
        codeIndexed: number;
        imageIndexed: number;
        lastIndexedAtMs: number | null;
    } | null>(null);

    async function handlePick() {
        setLoading(true);
        setError(null);
        try {
            const result = await window.watcher.pickDirectory({ includeCodeFiles: false, indexAllFiles: false });
            if (!result.canceled && result.path) {
                setWatchedPath(result.path);
                setStats(result.indexingStats);
                setLoading(false);
            } else {
                setError("Failed to open directory. Please try again.");
                setLoading(false);
            }
        } catch {
            setError("An unexpected error occurred.");
            setLoading(false);
        }
    }

    const handleCancel = () => {
        setWatchedPath(null);
        setLoading(false);
        setError(null);
    };

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Icon sx={{ fontSize: 16, color: theme.palette.primary.main }}>folder_open</Icon>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: theme.palette.text.primary }}>
                        Choose a folder to watch
                    </Typography>
                </Box>
                <Tooltip title="Reset">
                    <IconButton size="small" onClick={handleCancel} sx={{ p: 0.5 }}>
                        <Icon sx={{ fontSize: 16, color: theme.palette.text.secondary }}>close</Icon>
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Box
                    sx={{
                        mb: 1.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 0.75,
                    }}
                >
                    <Icon sx={{ fontSize: 15, color: theme.palette.error.main, mt: 0.15, flexShrink: 0 }}>warning</Icon>
                    <Typography sx={{ fontSize: '0.78rem', color: theme.palette.error.main }}>
                        {error}
                    </Typography>
                </Box>
            )}

            <Button
                variant={loading ? "outlined" : "contained"}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Icon>folder</Icon>}
                onClick={handlePick}
                disabled={loading}
                sx={{ mb: 1.25, fontSize: '0.8rem' }}
            >
                {loading ? "Indexing…" : "Choose folder"}
            </Button>

            <Typography sx={{ fontSize: '0.76rem', color: theme.palette.text.secondary, mb: 0.5 }}>
                Using default safe indexing rules (code files off, skip filtering on).
            </Typography>

            {watchedPath && (
                <Box
                    sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.06),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: stats ? 0.75 : 0 }}>
                        <Icon sx={{ fontSize: 14, color: '#4CAF50', flexShrink: 0 }}>check_circle</Icon>
                        <Typography
                            sx={{
                                fontSize: '0.78rem',
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                                wordBreak: 'break-all',
                            }}
                        >
                            {watchedPath}
                        </Typography>
                    </Box>
                    {stats && (
                        <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                            {stats.indexed} indexed · {stats.textIndexed} text · {stats.codeIndexed} code · {stats.imageIndexed} images · {stats.skipped} skipped
                            {stats.lastIndexedAtMs ? ` · ${new Date(stats.lastIndexedAtMs).toLocaleTimeString()}` : ""}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
}

export default FileWatcherPicker;
