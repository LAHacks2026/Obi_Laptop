import { Box, Button, Chip, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

export type AppStatus = 'connected' | 'not-connected' | 'coming-soon' | 'indexing' | 'error';

type AppConnectionCardProps = {
    iconLetter: string;
    iconBg: string;
    name: string;
    description: string;
    status: AppStatus;
    onAction?: () => void;
};

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string }> = {
    'connected':      { label: 'Connected',       color: '#4CAF50' },
    'not-connected':  { label: 'Not Connected',    color: '#757575' },
    'coming-soon':    { label: 'Coming Soon',      color: '#9E9E9E' },
    'indexing':       { label: 'Indexing...',      color: '#FCA311' },
    'error':          { label: 'Error',            color: '#F44336' },
};

const ACTION_LABEL: Record<AppStatus, string | null> = {
    'connected':     'Manage',
    'not-connected': 'Connect',
    'coming-soon':   null,
    'indexing':      'Pause',
    'error':         'Reconnect',
};

export default function AppConnectionCard({
    iconLetter,
    iconBg,
    name,
    description,
    status,
    onAction,
}: AppConnectionCardProps) {
    const theme = useTheme();
    const cfg = STATUS_CONFIG[status];
    const actionLabel = ACTION_LABEL[status];
    const isComingSoon = status === 'coming-soon';

    return (
        <Box
            sx={{
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.outline.variant}`,
                backgroundColor: theme.palette.surface.mid,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                opacity: isComingSoon ? 0.65 : 1,
                transition: 'border-color 180ms ease, opacity 180ms ease',
                '&:hover': {
                    borderColor: isComingSoon
                        ? theme.palette.outline.variant
                        : theme.palette.primary.main,
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        backgroundColor: iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        fontFamily: `'Space Grotesk', sans-serif`,
                        letterSpacing: '-0.02em',
                        flexShrink: 0,
                    }}
                >
                    {iconLetter}
                </Box>
                <Chip
                    label={cfg.label}
                    size="small"
                    sx={{
                        height: 22,
                        borderRadius: 1,
                        backgroundColor: alpha(cfg.color, 0.12),
                        color: cfg.color,
                        border: `1px solid ${alpha(cfg.color, 0.25)}`,
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        letterSpacing: '0.06em',
                        '& .MuiChip-label': { px: 1 },
                    }}
                />
            </Box>

            <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                    {name}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, fontSize: '0.8rem' }}>
                    {description}
                </Typography>
            </Box>

            {actionLabel && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onAction}
                    disabled={isComingSoon}
                    sx={{
                        alignSelf: 'flex-start',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        py: 0.5,
                        px: 1.5,
                    }}
                >
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
}
