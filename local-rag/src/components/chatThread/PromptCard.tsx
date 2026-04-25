import { Box, Card, Stack, Typography, useTheme } from "@mui/material";

type PromptCardProps = {
    icon: React.ReactNode;
    title: string;
    body: string;
    wide?: boolean;
    onClick?: () => void;
};

function PromptCard({ icon, title, body, wide, onClick }: PromptCardProps) {
    const theme = useTheme();

    return (
        <Card
            variant="outlined"
            onClick={onClick}
            sx={{
                p: 2.25,
                cursor: onClick ? "pointer" : "default",
                backgroundColor: theme.palette.surface.low,
                borderColor: "transparent",
                transition: "all 180ms ease",
                gridColumn: wide ? { md: "span 2" } : undefined,
                "&:hover": {
                    backgroundColor: theme.palette.surface.high,
                    borderColor: "rgba(72,72,72,0.35)",
                },
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Box sx={{ color: theme.palette.secondary.main, display: "flex" }}>{icon}</Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: theme.palette.text.secondary,
                        opacity: 0.7,
                    }}
                >
                    ↗
                </Typography>
            </Stack>

            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
                {title}
            </Typography>

            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                {body}
            </Typography>
        </Card>
    );
}

export default PromptCard;