import { useEffect, useState } from "react";
import { Box, Button, Divider, Icon, Switch, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import ThemeToggleButton from "../ui/ThemeToggleButton";

type SettingsScreenProps = {
    selectedTheme: 'light' | 'dark';
    onToggleTheme: () => void;
};

type IndexStats = {
    scanned: number;
    indexed: number;
    skipped: number;
    textIndexed: number;
    codeIndexed: number;
    imageIndexed: number;
    lastIndexedAtMs: number | null;
};

type WatcherStatus = {
    status: string;
    rootPath: string | null;
};

function SettingRow({
    label,
    description,
    control,
}: {
    label: string;
    description?: string;
    control: React.ReactNode;
}) {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.5 }}>
            <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>{label}</Typography>
                {description && (
                    <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary, mt: 0.25, lineHeight: 1.5 }}>
                        {description}
                    </Typography>
                )}
            </Box>
            <Box sx={{ flexShrink: 0 }}>{control}</Box>
        </Box>
    );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
            <Icon sx={{ fontSize: 18, color: theme.palette.primary.main }}>{icon}</Icon>
            <Typography
                sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: theme.palette.text.secondary,
                }}
            >
                {title}
            </Typography>
        </Box>
    );
}

export default function SettingsScreen({ selectedTheme, onToggleTheme }: SettingsScreenProps) {
    const theme = useTheme();
    const [stats, setStats] = useState<IndexStats | null>(null);
    const [watcher, setWatcher] = useState<WatcherStatus | null>(null);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
    const [autoIndex, setAutoIndex] = useState(true);

    useEffect(() => {
        window.api.rag.stats().then(setStats).catch(() => {});
        window.watcher.status().then((s) => setWatcher({ status: s.status, rootPath: s.rootPath })).catch(() => {});
    }, []);

    const lastIndexed = stats?.lastIndexedAtMs
        ? new Date(stats.lastIndexedAtMs).toLocaleString()
        : 'Never';

    return (
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <Box sx={{ px: 4, py: 4, maxWidth: 680, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                        Settings
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                        Manage your preferences, index, and privacy controls.
                    </Typography>
                </Box>

                {/* Appearance */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        backgroundColor: theme.palette.surface.mid,
                        mb: 2,
                    }}
                >
                    <SectionHeader icon="palette" title="Appearance" />
                    <SettingRow
                        label="Theme"
                        description="Switch between light and dark mode."
                        control={
                            <ThemeToggleButton mode={selectedTheme} onToggle={onToggleTheme} />
                        }
                    />
                </Box>

                {/* Indexing */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        backgroundColor: theme.palette.surface.mid,
                        mb: 2,
                    }}
                >
                    <SectionHeader icon="folder_open" title="Indexing" />

                    {watcher && (
                        <>
                            <SettingRow
                                label="Watched Folder"
                                description={watcher.rootPath ?? 'No folder selected'}
                                control={
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.4,
                                            borderRadius: 1,
                                            backgroundColor: alpha(
                                                watcher.status === 'running' ? '#4CAF50' : theme.palette.text.disabled,
                                                0.12,
                                            ),
                                            border: `1px solid ${alpha(
                                                watcher.status === 'running' ? '#4CAF50' : theme.palette.text.disabled,
                                                0.25,
                                            )}`,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                color: watcher.status === 'running' ? '#4CAF50' : theme.palette.text.secondary,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                            }}
                                        >
                                            {watcher.status}
                                        </Typography>
                                    </Box>
                                }
                            />
                            <Divider sx={{ my: 1 }} />
                        </>
                    )}

                    {stats && (
                        <>
                            <SettingRow
                                label="Files Indexed"
                                description={`Last updated: ${lastIndexed}`}
                                control={
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: theme.palette.primary.main }}>
                                        {stats.indexed.toLocaleString()}
                                    </Typography>
                                }
                            />
                            <Divider sx={{ my: 1 }} />
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: 1,
                                    py: 1,
                                }}
                            >
                                {[
                                    { label: 'Text', value: stats.textIndexed },
                                    { label: 'Code', value: stats.codeIndexed },
                                    { label: 'Images', value: stats.imageIndexed },
                                ].map(({ label, value }) => (
                                    <Box
                                        key={label}
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 1,
                                            backgroundColor: theme.palette.surface.high,
                                            border: `1px solid ${theme.palette.outline.variant}`,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                            {value.toLocaleString()}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.68rem', color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            {label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Divider sx={{ my: 1 }} />
                        </>
                    )}

                    <SettingRow
                        label="Auto-index on changes"
                        description="Automatically re-index files when they are modified."
                        control={
                            <Switch
                                size="small"
                                checked={autoIndex}
                                onChange={(e) => setAutoIndex(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: theme.palette.primary.main,
                                    },
                                }}
                            />
                        }
                    />
                </Box>

                {/* Privacy */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        backgroundColor: theme.palette.surface.mid,
                        mb: 2,
                    }}
                >
                    <SectionHeader icon="shield" title="Privacy" />
                    <SettingRow
                        label="Local processing only"
                        description="Obi processes all data on your device. No data is sent to external servers."
                        control={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Icon sx={{ fontSize: 16, color: '#4CAF50' }}>check_circle</Icon>
                                <Typography sx={{ fontSize: '0.78rem', color: '#4CAF50', fontWeight: 600 }}>
                                    Active
                                </Typography>
                            </Box>
                        }
                    />
                    <Divider sx={{ my: 1 }} />
                    <SettingRow
                        label="Usage analytics"
                        description="Send anonymous usage data to help improve Obi. No file contents are included."
                        control={
                            <Switch
                                size="small"
                                checked={analyticsEnabled}
                                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: theme.palette.primary.main,
                                    },
                                }}
                            />
                        }
                    />
                </Box>

                {/* Local data controls */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        backgroundColor: theme.palette.surface.mid,
                        mb: 2,
                    }}
                >
                    <SectionHeader icon="storage" title="Local Data" />
                    <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary, mb: 2, lineHeight: 1.6 }}>
                        All indexed data is stored locally on your device. You can stop the watcher
                        or clear the index at any time.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Icon>stop_circle</Icon>}
                            onClick={async () => {
                                try { await window.watcher.stop(); } catch { }
                            }}
                            sx={{ fontSize: '0.78rem' }}
                        >
                            Stop Watcher
                        </Button>
                    </Box>
                </Box>

                {/* About */}
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        backgroundColor: theme.palette.surface.mid,
                    }}
                >
                    <SectionHeader icon="info" title="About" />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon sx={{ fontSize: 18, color: theme.palette.primary.contrastText }}>tokens</Icon>
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Obi</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                                Local Intelligence · v0.1.0
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
