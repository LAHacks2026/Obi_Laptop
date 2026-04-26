import { Box, Button, Icon, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import AppConnectionCard from "../ui/AppConnectionCard";

const APPS = [
    {
        iconLetter: 'LF',
        iconBg: '#14213D',
        name: 'Local Files',
        description: 'Index and search documents, notes, and code on your machine.',
        status: 'connected' as const,
    },
    {
        iconLetter: 'G',
        iconBg: '#EA4335',
        name: 'Gmail',
        description: 'Search emails and attachments directly from your inbox.',
        status: 'coming-soon' as const,
    },
    {
        iconLetter: 'GD',
        iconBg: '#4285F4',
        name: 'Google Drive',
        description: 'Find documents and files stored in your Google Drive.',
        status: 'coming-soon' as const,
    },
    {
        iconLetter: 'N',
        iconBg: '#191919',
        name: 'Notion',
        description: 'Search pages, databases, and notes in your Notion workspace.',
        status: 'coming-soon' as const,
    },
    {
        iconLetter: 'S',
        iconBg: '#4A154B',
        name: 'Slack',
        description: 'Search messages, threads, and shared files from Slack.',
        status: 'coming-soon' as const,
    },
    {
        iconLetter: 'GH',
        iconBg: '#24292F',
        name: 'GitHub',
        description: 'Search repositories, issues, PRs, and code from GitHub.',
        status: 'coming-soon' as const,
    },
];

export default function VaultAppsScreen() {
    const theme = useTheme();
    const [gmailStatus, setGmailStatus] = useState<{
        connected: boolean;
        syncing: boolean;
        lastError: string | null;
        indexedCount: number;
        lastSyncedAtMs: number | null;
    } | null>(null);
    const [gmailActionError, setGmailActionError] = useState<string | null>(null);

    const loadGmailStatus = async () => {
        try {
            const status = await window.api.gmail.status();
            setGmailStatus(status);
        } catch (error) {
            setGmailActionError(String((error as Error)?.message ?? error));
        }
    };

    useEffect(() => {
        void loadGmailStatus();
    }, []);

    const handleGmailSync = async () => {
        setGmailActionError(null);
        try {
            await window.api.gmail.syncMetadata(200);
            await loadGmailStatus();
        } catch (error) {
            setGmailActionError(String((error as Error)?.message ?? error));
            await loadGmailStatus();
        }
    };

    const handleGmailClear = async () => {
        setGmailActionError(null);
        try {
            await window.api.gmail.clearIndex();
            await loadGmailStatus();
        } catch (error) {
            setGmailActionError(String((error as Error)?.message ?? error));
            await loadGmailStatus();
        }
    };

    const gmailCardStatus = gmailStatus?.syncing
        ? "indexing"
        : gmailStatus?.lastError
            ? "error"
            : gmailStatus?.connected
                ? "connected"
                : "not-connected";
    const gmailLastSynced = gmailStatus?.lastSyncedAtMs
        ? new Date(gmailStatus.lastSyncedAtMs).toLocaleString()
        : "Never";
    const gmailIndexedCount = gmailStatus?.indexedCount ?? 0;

    return (
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <Box sx={{ px: 4, py: 4, maxWidth: 960, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon sx={{ color: theme.palette.primary.main, fontSize: 20 }}>hub</Icon>
                        </Box>
                        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                            Connected Apps
                        </Typography>
                    </Box>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Connect your apps so Obi can search across all your data.
                        Your credentials stay on your device.
                    </Typography>
                </Box>

                {/* App grid */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                        gap: 2,
                        mb: 5,
                    }}
                >
                    {APPS.map((app) => {
                        if (app.name !== "Gmail") {
                            return (
                                <AppConnectionCard
                                    key={app.name}
                                    iconLetter={app.iconLetter}
                                    iconBg={app.iconBg}
                                    name={app.name}
                                    description={app.description}
                                    status={app.status}
                                />
                            );
                        }

                        return (
                            <Box key={app.name}>
                                <AppConnectionCard
                                    iconLetter={app.iconLetter}
                                    iconBg={app.iconBg}
                                    name={app.name}
                                    description={`Metadata-only sync (subject/snippet/sender/date/labels). Indexed emails: ${gmailIndexedCount}. Last sync: ${gmailLastSynced}.`}
                                    status={gmailCardStatus}
                                    onAction={handleGmailSync}
                                />
                                <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<Icon>delete_sweep</Icon>}
                                        onClick={handleGmailClear}
                                    >
                                        Clear Gmail Index
                                    </Button>
                                    <Typography sx={{ fontSize: "0.72rem", color: theme.palette.text.secondary }}>
                                        Requires `OBI_GMAIL_ACCESS_TOKEN`.
                                    </Typography>
                                </Box>
                                {(gmailActionError || gmailStatus?.lastError) && (
                                    <Typography sx={{ mt: 0.75, fontSize: "0.72rem", color: theme.palette.error.main }}>
                                        {gmailActionError ?? gmailStatus?.lastError}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                {/* Privacy note */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        backgroundColor: theme.palette.surface.mid,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                    }}
                >
                    <Icon sx={{ color: theme.palette.primary.main, fontSize: 20, mt: 0.1, flexShrink: 0 }}>shield</Icon>
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 0.4 }}>
                            Your data, your control
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                            Obi processes your data locally whenever possible. When cloud connectors
                            are added, only the content you choose to index is accessed. You can disconnect
                            any app and delete its index at any time.
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
