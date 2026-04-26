import { Box, Button, Chip, Icon, IconButton, Tooltip, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import type { SearchResult } from "../../types/global";

function getFileExt(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'file';
}

function getRelevance(distance: number): { label: string; color: string } {
    if (distance < 0.35) return { label: 'High match', color: '#4CAF50' };
    if (distance < 0.6) return { label: 'Good match', color: '#FCA311' };
    return { label: 'Possible match', color: '#757575' };
}

type FilePreviewPanelProps = {
    result: SearchResult;
    onBack: () => void;
    onAskObi: (query: string) => void;
};

export default function FilePreviewPanel({ result, onBack, onAskObi }: FilePreviewPanelProps) {
    const theme = useTheme();
    const rel = getRelevance(result.distance);
    const ext = getFileExt(result.fileName);

    const handleOpen = async () => {
        const res = await window.api.openIndexedPath(result.documentPath);
        if (!res.ok) console.warn('[openIndexedPath]', result.documentPath, (res as any).error);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: theme.palette.surface.low,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.outline.variant}`,
                    flexShrink: 0,
                }}
            >
                <IconButton size="small" onClick={onBack} sx={{ p: 0.5 }}>
                    <Icon sx={{ fontSize: 18 }}>arrow_back</Icon>
                </IconButton>
                <Typography
                    sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: theme.palette.text.secondary,
                    }}
                >
                    Source Preview
                </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* File name + type */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Chip
                            label={ext.toUpperCase()}
                            size="small"
                            sx={{
                                height: 20,
                                borderRadius: 0.75,
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                color: theme.palette.primary.main,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                '& .MuiChip-label': { px: 0.75 },
                            }}
                        />
                        <Chip
                            label={rel.label}
                            size="small"
                            sx={{
                                height: 20,
                                borderRadius: 0.75,
                                backgroundColor: alpha(rel.color, 0.1),
                                color: rel.color,
                                border: `1px solid ${alpha(rel.color, 0.2)}`,
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                '& .MuiChip-label': { px: 0.75 },
                            }}
                        />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.5 }}>
                        {result.fileName}
                    </Typography>
                </Box>

                {/* Path */}
                <Box>
                    <Typography
                        sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: theme.palette.text.secondary,
                            mb: 0.5,
                        }}
                    >
                        File Path
                    </Typography>
                    <Tooltip title={result.documentPath} placement="bottom-start">
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: 1,
                                backgroundColor: theme.palette.surface.mid,
                                border: `1px solid ${theme.palette.outline.variant}`,
                                cursor: 'default',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '0.72rem',
                                    color: theme.palette.text.secondary,
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                    lineHeight: 1.5,
                                }}
                            >
                                {result.documentPath}
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>

                {/* Section title */}
                {result.sectionTitle && (
                    <Box>
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: theme.palette.text.secondary,
                                mb: 0.5,
                            }}
                        >
                            Section
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                            }}
                        >
                            § {result.sectionTitle}
                        </Typography>
                    </Box>
                )}

                {/* Content excerpt */}
                <Box>
                    <Typography
                        sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: theme.palette.text.secondary,
                            mb: 0.75,
                        }}
                    >
                        Matched Content
                    </Typography>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: theme.palette.surface.mid,
                            border: `1px solid ${theme.palette.outline.variant}`,
                            borderLeft: `3px solid ${theme.palette.primary.main}`,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                color: theme.palette.text.primary,
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {result.content}
                        </Typography>
                    </Box>
                </Box>

                {/* Metadata */}
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: theme.palette.surface.mid,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1,
                    }}
                >
                    {[
                        { label: 'Source', value: 'Local Files' },
                        { label: 'Type', value: result.modality ?? 'text' },
                        { label: 'Chunk ID', value: String(result.chunkId) },
                        { label: 'Distance', value: result.distance.toFixed(4) },
                    ].map(({ label, value }) => (
                        <Box key={label}>
                            <Typography sx={{ fontSize: '0.6rem', color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                                {label}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.primary, fontWeight: 500, mt: 0.25 }}>
                                {value}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Actions */}
            <Box
                sx={{
                    p: 1.5,
                    borderTop: `1px solid ${theme.palette.outline.variant}`,
                    display: 'flex',
                    gap: 1,
                    flexShrink: 0,
                }}
            >
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Icon sx={{ fontSize: 16 }}>open_in_new</Icon>}
                    onClick={handleOpen}
                    sx={{ fontSize: '0.75rem', py: 0.75 }}
                >
                    Open File
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Icon sx={{ fontSize: 16 }}>chat_bubble</Icon>}
                    onClick={() => onAskObi(`Tell me about ${result.fileName}`)}
                    sx={{ fontSize: '0.75rem', py: 0.75 }}
                >
                    Ask Obi
                </Button>
            </Box>
        </Box>
    );
}
