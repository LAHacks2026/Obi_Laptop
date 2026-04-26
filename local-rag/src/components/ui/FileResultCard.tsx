import { Box, Button, Chip, Icon, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import type { SearchResult } from "../../types/global";

function getFileExt(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function getFileIcon(filename: string): string {
    const ext = getFileExt(filename);
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
    if (['md', 'markdown', 'txt'].includes(ext)) return 'article';
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rb', 'rs', 'c', 'cpp', 'swift'].includes(ext)) return 'code';
    if (['html', 'htm'].includes(ext)) return 'html';
    if (['css', 'scss', 'less'].includes(ext)) return 'css';
    if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return 'data_object';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'video_file';
    if (['mp3', 'wav'].includes(ext)) return 'audio_file';
    if (['zip', 'tar', 'gz'].includes(ext)) return 'folder_zip';
    return 'insert_drive_file';
}

function getFileIconColor(filename: string): string {
    const ext = getFileExt(filename);
    if (ext === 'pdf') return '#F44336';
    if (['doc', 'docx'].includes(ext)) return '#2196F3';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '#4CAF50';
    if (['ppt', 'pptx'].includes(ext)) return '#FF9800';
    if (['md', 'markdown', 'txt'].includes(ext)) return '#9E9E9E';
    if (['js', 'jsx'].includes(ext)) return '#F7DF1E';
    if (['ts', 'tsx'].includes(ext)) return '#3178C6';
    if (['py'].includes(ext)) return '#3776AB';
    if (['go'].includes(ext)) return '#00ADD8';
    if (['json', 'yaml', 'yml'].includes(ext)) return '#E91E63';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return '#9C27B0';
    return '#757575';
}

function getRelevance(distance: number): { label: string; color: string } {
    if (distance < 0.35) return { label: 'High match', color: '#4CAF50' };
    if (distance < 0.6) return { label: 'Good match', color: '#FCA311' };
    return { label: 'Possible match', color: '#757575' };
}

function shortenPath(fullPath: string, maxSegments = 4): string {
    const sep = fullPath.includes('\\') ? '\\' : '/';
    const parts = fullPath.split(sep).filter(Boolean);
    if (parts.length <= maxSegments) return fullPath;
    return `…/${parts.slice(-maxSegments).join('/')}`;
}

type FileResultCardProps = {
    result: SearchResult;
    rank?: number;
    compact?: boolean;
    selected?: boolean;
    onClick?: () => void;
    onOpen?: (filePath: string) => void;
    onAskObi?: (query: string) => void;
};

export default function FileResultCard({
    result,
    rank,
    compact = false,
    selected = false,
    onClick,
    onOpen,
    onAskObi,
}: FileResultCardProps) {
    const theme = useTheme();
    const rel = getRelevance(result.distance);
    const iconColor = getFileIconColor(result.fileName);
    const iconName = getFileIcon(result.fileName);
    const ext = getFileExt(result.fileName) || 'file';
    const shortPath = shortenPath(result.documentPath);
    const preview = result.content.slice(0, 200).trim();
    const isTopResult = rank === 1;

    if (compact) {
        // Panel compact view — Google-inspired row
        return (
            <Box
                onClick={onClick}
                sx={{
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 1.5,
                    border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.outline.variant}`,
                    backgroundColor: selected
                        ? alpha(theme.palette.primary.main, 0.06)
                        : 'transparent',
                    cursor: onClick ? 'pointer' : 'default',
                    transition: 'all 150ms ease',
                    '&:hover': onClick
                        ? {
                            borderColor: alpha(theme.palette.primary.main, 0.5),
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                        : {},
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {rank !== undefined && (
                        <Typography
                            sx={{
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                color: theme.palette.text.disabled,
                                letterSpacing: '-0.02em',
                                lineHeight: 1,
                                mt: 0.3,
                                flexShrink: 0,
                                width: 16,
                            }}
                        >
                            {String(rank).padStart(2, '0')}
                        </Typography>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: theme.palette.primary.main,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3,
                                mb: 0.2,
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            {result.fileName}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                color: '#4a7c59',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                mb: 0.4,
                            }}
                        >
                            {shortPath}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.72rem',
                                color: theme.palette.text.secondary,
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {preview}{preview.length < result.content.length ? '…' : ''}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    // Full card view (Files screen)
    return (
        <Box
            onClick={onClick}
            sx={{
                p: 2.25,
                borderRadius: 2,
                border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.outline.variant}`,
                backgroundColor: selected
                    ? alpha(theme.palette.primary.main, 0.06)
                    : theme.palette.surface.mid,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 180ms ease',
                '&:hover': onClick
                    ? {
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }
                    : {},
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 1,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(iconColor, 0.12),
                        border: `1px solid ${alpha(iconColor, 0.22)}`,
                    }}
                >
                    <Icon sx={{ fontSize: 20, color: iconColor }}>{iconName}</Icon>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.2 }}>
                        {isTopResult && (
                            <Box
                                sx={{
                                    px: 0.75,
                                    py: 0.1,
                                    borderRadius: 0.5,
                                    backgroundColor: alpha('#FCA311', 0.15),
                                    border: `1px solid ${alpha('#FCA311', 0.3)}`,
                                    flexShrink: 0,
                                }}
                            >
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#FCA311', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Most Relevant
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: theme.palette.primary.main,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3,
                            mb: 0.3,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        {result.fileName}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: '#4a7c59',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {shortPath}
                    </Typography>
                </Box>

                <Chip
                    label={ext.toUpperCase()}
                    size="small"
                    sx={{
                        height: 20,
                        borderRadius: 0.75,
                        backgroundColor: alpha(iconColor, 0.12),
                        color: iconColor,
                        border: `1px solid ${alpha(iconColor, 0.22)}`,
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        '& .MuiChip-label': { px: 0.75 },
                    }}
                />
            </Box>

            {/* Content */}
            <Box sx={{ mt: 1.25 }}>
                {result.sectionTitle && (
                    <Typography
                        sx={{
                            fontSize: '0.68rem',
                            color: theme.palette.text.secondary,
                            fontStyle: 'italic',
                            mb: 0.5,
                        }}
                    >
                        § {result.sectionTitle}
                    </Typography>
                )}

                <Typography
                    sx={{
                        fontSize: '0.82rem',
                        color: theme.palette.text.secondary,
                        lineHeight: 1.65,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1.5,
                    }}
                >
                    {preview}
                    {preview.length < result.content.length ? '…' : ''}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
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

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onOpen && (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpen(result.documentPath);
                                }}
                                sx={{ py: 0.25, px: 1.25, fontSize: '0.7rem', minHeight: 0, height: 26, borderRadius: 1 }}
                            >
                                Open
                            </Button>
                        )}
                        {onAskObi && (
                            <Button
                                size="small"
                                variant="contained"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAskObi(`Tell me about ${result.fileName}`);
                                }}
                                sx={{ py: 0.25, px: 1.25, fontSize: '0.7rem', minHeight: 0, height: 26, borderRadius: 1 }}
                            >
                                Ask Obi
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
