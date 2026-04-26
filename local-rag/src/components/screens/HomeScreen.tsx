import { useState, useEffect } from "react";
import { Box, Chip, Icon, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import SearchBar from "../ui/SearchBar";

type HomeScreenProps = {
    onNavigateToChat: (query?: string) => void;
};

const SUGGESTIONS = [
    { icon: 'article', title: 'Summarize notes', prompt: 'Summarize my recent notes and documents' },
    { icon: 'search', title: 'Find a document', prompt: 'Find documents related to my project' },
    { icon: 'code', title: 'Explain code', prompt: 'Explain the code in my repository' },
    { icon: 'history', title: 'Recent changes', prompt: 'What files did I work on most recently?' },
];

function getRecentSearches(): string[] {
    try {
        const stored = localStorage.getItem('obi-recent-searches');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function addRecentSearch(query: string) {
    try {
        const existing = getRecentSearches();
        const updated = [query, ...existing.filter((s) => s !== query)].slice(0, 6);
        localStorage.setItem('obi-recent-searches', JSON.stringify(updated));
    } catch {
        // ignore
    }
}

export default function HomeScreen({ onNavigateToChat }: HomeScreenProps) {
    const theme = useTheme();
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    const handleSearch = (q: string) => {
        if (!q.trim()) return;
        addRecentSearch(q.trim());
        onNavigateToChat(q.trim());
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100%',
                px: 3,
                py: 6,
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 680 }}>
                {/* Brand */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 5,
                    }}
                >
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                            mb: 2.5,
                        }}
                    >
                        <Icon sx={{ fontSize: 28, color: theme.palette.primary.contrastText }}>tokens</Icon>
                    </Box>

                    <Typography
                        sx={{
                            fontSize: { xs: 32, md: 44 },
                            fontWeight: 700,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                            textAlign: 'center',
                            mb: 1.5,
                        }}
                    >
                        What can I find{' '}
                        <Box component="span" sx={{ color: theme.palette.primary.main }}>
                            for you?
                        </Box>
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: theme.palette.text.secondary,
                            textAlign: 'center',
                            maxWidth: 480,
                            lineHeight: 1.7,
                            fontSize: '1rem',
                        }}
                    >
                        Search your files, notes, and documents using natural language.
                        Everything stays on your device.
                    </Typography>
                </Box>

                {/* Search bar */}
                <Box sx={{ mb: 2.5 }}>
                    <SearchBar
                        value={query}
                        onChange={setQuery}
                        onSearch={handleSearch}
                        placeholder="Ask anything about your files…"
                        size="large"
                        autoFocus
                    />
                </Box>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                            sx={{
                                fontSize: '0.7rem',
                                color: theme.palette.text.secondary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                        >
                            Recent:
                        </Typography>
                        {recentSearches.map((s) => (
                            <Chip
                                key={s}
                                label={s}
                                size="small"
                                onClick={() => handleSearch(s)}
                                icon={<Icon sx={{ fontSize: '14px !important' }}>history</Icon>}
                                sx={{
                                    height: 26,
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    backgroundColor: theme.palette.surface.mid,
                                    border: `1px solid ${theme.palette.outline.variant}`,
                                    transition: 'all 150ms ease',
                                    '&:hover': {
                                        backgroundColor: theme.palette.surface.high,
                                        borderColor: theme.palette.primary.main,
                                    },
                                    '& .MuiChip-label': { px: 1 },
                                    '& .MuiChip-icon': { ml: 0.75 },
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* Suggestion cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr' },
                        gap: 1.5,
                        mb: 5,
                    }}
                >
                    {SUGGESTIONS.map((s) => (
                        <Box
                            key={s.title}
                            onClick={() => handleSearch(s.prompt)}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.outline.variant}`,
                                backgroundColor: theme.palette.surface.mid,
                                cursor: 'pointer',
                                transition: 'all 180ms ease',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                    transform: 'translateY(-1px)',
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Icon sx={{ fontSize: 18, color: theme.palette.primary.main }}>{s.icon}</Icon>
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 0.25 }}>
                                    {s.title}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, lineHeight: 1.5 }}>
                                    {s.prompt}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Privacy badge */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                    }}
                >
                    <Icon sx={{ fontSize: 14, color: theme.palette.text.secondary }}>shield</Icon>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            color: theme.palette.text.secondary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}
                    >
                        Your files stay on your device. Always.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
