import { Box, Button, Icon, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type EmptyStateProps = {
    icon?: string;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void; icon?: string };
};

export default function EmptyState({
    icon = 'search_off',
    title,
    description,
    action,
}: EmptyStateProps) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 10,
                textAlign: 'center',
                gap: 2,
            }}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.palette.surface.high,
                    border: `1px solid ${theme.palette.outline.variant}`,
                }}
            >
                <Icon sx={{ fontSize: 28, color: theme.palette.text.secondary }}>{icon}</Icon>
            </Box>
            <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                    {title}
                </Typography>
                {description && (
                    <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary, maxWidth: 340, mx: 'auto' }}
                    >
                        {description}
                    </Typography>
                )}
            </Box>
            {action && (
                <Button
                    variant="outlined"
                    onClick={action.onClick}
                    startIcon={action.icon ? <Icon>{action.icon}</Icon> : undefined}
                    sx={{ mt: 1 }}
                >
                    {action.label}
                </Button>
            )}
        </Box>
    );
}
