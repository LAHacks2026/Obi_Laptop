import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Button, Chip, CircularProgress, Divider, Icon, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import type { SearchResult } from "../../types/global";
import SearchBar from "../ui/SearchBar";
import FileResultCard from "../ui/FileResultCard";
import FilePreviewPanel from "../ui/FilePreviewPanel";
import EmptyState from "../ui/EmptyState";
import FileWatcherPicker from "../FileWatcherPicker";

type IndexStats = {
    scanned: number;
    indexed: number;
    skipped: number;
    textIndexed: number;
    codeIndexed: number;
    imageIndexed: number;
    lastIndexedAtMs: number | null;
};

type FilesScreenProps = {
    onNavigateToChat: (query?: string) => void;
};

type FilterType = 'all' | 'pdf' | 'docs' | 'code' | 'images' | 'sheets' | 'text';

const FILE_FILTERS: { key: FilterType; label: string; icon: string; exts: string[] }[] = [
    { key: 'all', label: 'All', icon: 'folder_open', exts: [] },
    { key: 'pdf', label: 'PDF', icon: 'picture_as_pdf', exts: ['pdf'] },
    { key: 'docs', label: 'Docs', icon: 'description', exts: ['doc', 'docx'] },
    { key: 'code', label: 'Code', icon: 'code', exts: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rb', 'rs', 'c', 'cpp', 'swift', 'html', 'css', 'scss', 'json', 'yaml', 'yml', 'toml'] },
    { key: 'images', label: 'Images', icon: 'image', exts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] },
    { key: 'sheets', label: 'Sheets', icon: 'table_chart', exts: ['xls', 'xlsx', 'csv'] },
    { key: 'text', label: 'Text / MD', icon: 'article', exts: ['txt', 'md', 'markdown'] },
];

function getExt(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export default function FilesScreen({ onNavigateToChat }: FilesScreenProps) {
    const theme = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [stats, setStats] = useState<IndexStats | null>(null);
    const [statsLoaded, setStatsLoaded] = useState(false);
    const [selectedFile, setSelectedFile] = useState<SearchResult | null>(null);
    const [showWatcher, setShowWatcher] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    const loadStats = useCallback(async () => {
        try {
            const s = await window.api.rag.stats();
            setStats(s);
        } catch {
            // ignore
        } finally {
            setStatsLoaded(true);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Auto-show watcher when stats are loaded and nothing is indexed
    useEffect(() => {
        if (statsLoaded && stats && stats.indexed === 0) {
            setShowWatcher(true);
        }
    }, [statsLoaded, stats]);

    const handleSearch = async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setSearching(true);
        setSelectedFile(null);
        try {
            const res = await window.api.rag.search(q, 25);
            setResults(res);
        } catch (e) {
            console.error('FilesScreen search error:', e);
        } finally {
            setSearching(false);
        }
    };

    const handleOpen = async (filePath: string) => {
        const res = await window.api.openIndexedPath(filePath);
        if (!res.ok) console.warn('[openIndexedPath]', filePath, (res as any).error);
    };

    const hasIndex = stats && stats.indexed > 0;
    const lastIndexed = stats?.lastIndexedAtMs
        ? new Date(stats.lastIndexedAtMs).toLocaleString()
        : null;

    const filteredResults = useMemo(() => {
        if (activeFilter === 'all') return results;
        const filter = FILE_FILTERS.find((f) => f.key === activeFilter);
        if (!filter || filter.exts.length === 0) return results;
        return results.filter((r) => filter.exts.includes(getExt(r.fileName)));
    }, [results, activeFilter]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Header */}
            <Box
                sx={{
                    px: 4,
                    pt: 3,
                    pb: 2,
                    flexShrink: 0,
                    borderBottom: `1px solid ${theme.palette.outline.variant}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 0.25 }}>
                            Files
                        </Typography>
                        {stats && (
                            <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
                                {stats.indexed.toLocaleString()} files indexed
                                {lastIndexed ? ` · Last updated ${lastIndexed}` : ''}
                            </Typography>
                        )}
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Icon>folder_open</Icon>}
                        onClick={() => setShowWatcher((v) => !v)}
                        sx={{ fontSize: '0.78rem' }}
                    >
                        {showWatcher ? 'Hide Setup' : 'Manage Index'}
                    </Button>
                </Box>

                {/* Stats bar */}
                {hasIndex && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 3,
                            p: 1.5,
                            borderRadius: 1.5,
                            backgroundColor: theme.palette.surface.mid,
                            border: `1px solid ${theme.palette.outline.variant}`,
                            mb: 2,
                            flexWrap: 'wrap',
                        }}
                    >
                        {[
                            { label: 'Indexed', value: stats!.indexed, icon: 'check_circle', color: '#4CAF50' },
                            { label: 'Text', value: stats!.textIndexed, icon: 'article', color: theme.palette.primary.main },
                            { label: 'Code', value: stats!.codeIndexed, icon: 'code', color: '#3178C6' },
                            { label: 'Images', value: stats!.imageIndexed, icon: 'image', color: '#9C27B0' },
                            { label: 'Skipped (latest scan)', value: stats!.skipped, icon: 'skip_next', color: theme.palette.text.secondary as string },
                        ].map(({ label, value, icon, color }) => (
                            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Icon sx={{ fontSize: 15, color }}>{icon}</Icon>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{value.toLocaleString()}</Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.secondary }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Watcher section */}
                {showWatcher && (
                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: theme.palette.surface.mid,
                            border: `1px solid ${theme.palette.outline.variant}`,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: theme.palette.text.secondary,
                                mb: 1.5,
                            }}
                        >
                            Index Setup
                        </Typography>
                        <FileWatcherPicker />
                    </Box>
                )}

                <SearchBar
                    value={query}
                    onChange={setQuery}
                    onSearch={handleSearch}
                    placeholder="Search your indexed files…"
                />

                {/* File type filters */}
                {results.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                        {FILE_FILTERS.map((f) => {
                            const isActive = activeFilter === f.key;
                            const count = f.key === 'all'
                                ? results.length
                                : results.filter((r) => f.exts.includes(getExt(r.fileName))).length;
                            if (f.key !== 'all' && count === 0) return null;
                            return (
                                <Chip
                                    key={f.key}
                                    icon={<Icon sx={{ fontSize: '14px !important' }}>{f.icon}</Icon>}
                                    label={`${f.label}${count > 0 && f.key !== 'all' ? ` (${count})` : ''}`}
                                    size="small"
                                    onClick={() => setActiveFilter(f.key)}
                                    sx={{
                                        height: 26,
                                        fontSize: '0.72rem',
                                        fontWeight: isActive ? 700 : 500,
                                        backgroundColor: isActive
                                            ? theme.palette.primary.main
                                            : alpha(theme.palette.primary.main, 0.07),
                                        color: isActive
                                            ? theme.palette.primary.contrastText
                                            : theme.palette.text.secondary,
                                        border: `1px solid ${isActive ? theme.palette.primary.main : theme.palette.outline.variant}`,
                                        cursor: 'pointer',
                                        '& .MuiChip-label': { px: 1 },
                                        '& .MuiChip-icon': {
                                            color: isActive ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                                            ml: 0.5,
                                        },
                                        '&:hover': {
                                            backgroundColor: isActive
                                                ? theme.palette.primary.dark
                                                : alpha(theme.palette.primary.main, 0.12),
                                        },
                                    }}
                                />
                            );
                        })}
                    </Box>
                )}
            </Box>

            {/* Content */}
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                }}
            >
                {/* Results list */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        overflowY: 'auto',
                        p: 3,
                    }}
                >
                    {searching && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 4, justifyContent: 'center' }}>
                            <CircularProgress size={20} />
                            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                Searching…
                            </Typography>
                        </Box>
                    )}

                    {!searching && query && results.length === 0 && (
                        <EmptyState
                            icon="search_off"
                            title="No results found"
                            description={`Nothing matched "${query}". Try different keywords or check your indexed folders.`}
                            action={{ label: 'Manage Index', onClick: () => setShowWatcher(true), icon: 'folder_open' }}
                        />
                    )}

                    {!searching && query && results.length > 0 && filteredResults.length === 0 && (
                        <EmptyState
                            icon="filter_list_off"
                            title="No results for this filter"
                            description="Try a different file type filter or remove the filter to see all results."
                            action={{ label: 'Show all', onClick: () => setActiveFilter('all'), icon: 'clear' }}
                        />
                    )}

                    {!searching && !query && !hasIndex && statsLoaded && (
                        <EmptyState
                            icon="folder_open"
                            title="No files indexed yet"
                            description="Choose a folder to index so Obi can search your files."
                            action={{ label: 'Set up indexing', onClick: () => setShowWatcher(true), icon: 'add' }}
                        />
                    )}

                    {!searching && !query && hasIndex && (
                        <EmptyState
                            icon="search"
                            title="Search your vault"
                            description={`${stats!.indexed.toLocaleString()} files are ready to search. Type a query above.`}
                        />
                    )}

                    {!searching && filteredResults.length > 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>
                                    {filteredResults.length}{filteredResults.length !== results.length ? ` of ${results.length}` : ''} result{filteredResults.length !== 1 ? 's' : ''} for
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                    "{query}"
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {filteredResults.map((r, i) => (
                                    <FileResultCard
                                        key={r.chunkId}
                                        result={r}
                                        rank={i + 1}
                                        selected={selectedFile?.chunkId === r.chunkId}
                                        onClick={() => setSelectedFile(r.chunkId === selectedFile?.chunkId ? null : r)}
                                        onOpen={handleOpen}
                                        onAskObi={onNavigateToChat}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* File preview panel */}
                {selectedFile && (
                    <Box
                        sx={{
                            width: 400,
                            flexShrink: 0,
                            borderLeft: `1px solid ${theme.palette.outline.variant}`,
                            overflow: 'hidden',
                        }}
                    >
                        <FilePreviewPanel
                            result={selectedFile}
                            onBack={() => setSelectedFile(null)}
                            onAskObi={(q) => {
                                setSelectedFile(null);
                                onNavigateToChat(q);
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
