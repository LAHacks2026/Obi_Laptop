import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { LlamaStatus } from "../../types/global";

type ChatThreadTopBarProps = {
    starting: boolean;
    chatModelStatus: LlamaStatus | null;
    sessionLabel?: string;
    homeLabel?: string;
    statusLabel: string;
};

export default function ChatThreadTopBar({
    starting,
    chatModelStatus,
    sessionLabel,
    homeLabel,
    statusLabel,
}: ChatThreadTopBarProps) {
    const theme = useTheme();

    const statusDotColor = starting
        ? theme.palette.text.disabled
        : statusLabel === "running"
            ? theme.palette.success.main
            : statusLabel === "starting"
                ? theme.palette.warning.main
                : statusLabel === "error"
                    ? theme.palette.error.main
                    : theme.palette.text.disabled;

    const chipText = starting ? "connecting..."
        : chatModelStatus?.baseUrl ?? "unknown";

    return (
        <Box
            sx={{
                width: "100%",
                minHeight: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            {/* Path */}
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                    sx={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                    }}
                >
                    {homeLabel}
                </Typography>

                <Typography
                    sx={{
                        fontSize: 12,
                        color: alpha(theme.palette.text.secondary, 0.45),
                    }}
                >
                    /
                </Typography>

                <Typography
                    sx={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                    }}
                >
                    {sessionLabel}
                </Typography>
            </Stack>

            {/* Status Chip */}
            <Chip
                label={
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box
                            sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "999px",
                                bgcolor: statusDotColor,
                                boxShadow:
                                    statusLabel === "running"
                                        ? `0 0 8px ${alpha(statusDotColor, 0.6)}`
                                        : "none",
                            }}
                        />

                        <Typography
                            component="span"
                            sx={{
                                fontSize: 10,
                                textTransform: "uppercase",
                                letterSpacing: "0.14em",
                                fontWeight: 600,
                            }}
                        >
                            {chipText}
                        </Typography>
                    </Stack>
                }
                sx={{
                    height: 28,
                    borderRadius: theme.shape,
                    backgroundColor: alpha(
                        theme.palette.mode === "dark"
                            ? theme.palette.common.white
                            : theme.palette.common.black,
                        0.04
                    ),
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    "& .MuiChip-label": {
                        px: 1,
                    },
                }}
            />
        </Box>
    );
}