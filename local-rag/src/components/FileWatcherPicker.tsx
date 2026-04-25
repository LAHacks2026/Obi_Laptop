import { Box, Button, Typography, Tooltip, Icon } from "@mui/material";
import { useState } from "react";

function FileWatcherPicker() {
    const [watchedPath, setWatchedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handlePick() {
        setLoading(true);
        setError(null);
        try {
            const result = await window.watcher.pickDirectory();
            if (!result.canceled && result.path) {
                setWatchedPath(result.path);
            } else {
                setError("Failed to open directory. Please try again.");
                setLoading(false);
            }
        } catch (err) {
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
        <Box
            sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ color: "#333" }}>
                    📁 File Watcher
                </Typography>
                <Tooltip title="Cancel">
                    <Icon onClick={handleCancel} sx={{ color: "#999" }}>
                        error
                    </Icon>
                </Tooltip>
            </Box>

            {loading && (
                <Box sx={{ mb: 2, borderRadius: 1, bgcolor: "#f5f5f5" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                        <Box sx={{ width: 20, height: 20, bgcolor: "#2196f3", borderRadius: 5, animation: "pulse 1.5s infinite" }}>
                            <Icon>refresh</Icon>
                        </Box>
                    </Box>
                </Box>
            )}

            {error && (
                <Box sx={{ mb: 2, bgcolor: "#ffebee", borderRadius: 1, padding: 1 }}>
                    <Typography variant="body2" color="#c62828">
                        ⚠️ {error}
                    </Typography>
                </Box>
            )}

            <Button
                variant={loading ? "outlined" : "contained"}
                startIcon={loading ? <Icon>refresh</Icon> : <Icon>folder</Icon>}
                onClick={handlePick}
                disabled={loading}
                sx={{
                    borderRadius: 1,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    "&:hover": {
                        bgcolor: "#e3f2fd",
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    },
                    "&:disabled": {
                        opacity: 0.7,
                        cursor: "not-allowed",
                        bgcolor: "#f5f5f5",
                        transform: "none",
                        boxShadow: "none",
                    },
                }}
            >
                {loading ? "Opening…" : "Choose folder to watch"}
            </Button>

            {watchedPath && (
                <Box sx={{ mt: 2, p: 1, bgcolor: "#f9f9f9", borderRadius: 1 }}>
                    <Typography variant="body2" color="#666" sx={{ fontSize: 14, fontWeight: 500 }}>
                        📂 Watching: <code>{watchedPath}</code>
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default FileWatcherPicker;