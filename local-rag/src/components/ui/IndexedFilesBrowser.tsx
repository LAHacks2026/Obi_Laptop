import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Icon,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import EmptyState from "./EmptyState";

type Modality = "text" | "code" | "image";
type SourceFilter = "all" | "local" | "github" | "notion" | "slack" | "drive";

type IndexedItem = {
    id: number;
    path: string;
    fileName: string;
    modality: Modality;
    source: string;
    indexedAtMs: number;
    updatedAtMs: number;
};

type ListResult = {
    items: IndexedItem[];
    total: number;
    offset: number;
    limit: number;
};

const PAGE_SIZE = 100;

const MODALITY_FILTERS: { key: "all" | Modality; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "view_list" },
    { key: "text", label: "Text", icon: "article" },
    { key: "code", label: "Code", icon: "code" },
    { key: "image", label: "Images", icon: "image" },
];

/**
 * Picks an icon for a row based on its modality. Kept in sync with the
 * MODALITY_FILTERS chips so the visual language is consistent across the
 * filter row and the list rows.
 */
function iconForModality(m: Modality): string {
    if (m === "image") return "image";
    if (m === "code") return "code";
    return "article";
}

/**
 * Source labels deliberately use Title Case + a remote/local hint so the
 * user can immediately tell whether a file lives on disk or came from a
 * connector. Currently only `local` is real; the remote labels are wired
 * to the listIndexed source filter so adding GitHub/Notion later requires
 * no UI change.
 */
function labelForSource(source: string): string {
    if (source === "local") return "Local";
    if (source === "github") return "GitHub";
    if (source === "notion") return "Notion";
    if (source === "slack") return "Slack";
    if (source === "drive") return "Drive";
    return source.charAt(0).toUpperCase() + source.slice(1);
}

function formatRelative(ms: number): string {
    if (!ms) return "—";
    const diffMs = Date.now() - ms;
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(ms).toLocaleDateString();
}

function truncateMiddle(s: string, max = 60): string {
    if (s.length <= max) return s;
    const half = Math.floor((max - 1) / 2);
    return `${s.slice(0, half)}…${s.slice(s.length - half)}`;
}

export type IndexedFilesBrowserProps = {
    /**
     * Toast / status message displayed at the top when an action
     * succeeds or fails. The parent owns this string so the same banner
     * style stays in sync with the rest of the screen.
     */
    statusMessage?: string | null;
    onClearStatus?: () => void;
};

export default function IndexedFilesBrowser({
    statusMessage,
    onClearStatus,
}: IndexedFilesBrowserProps) {
    const theme = useTheme();
    const [items, setItems] = useState<IndexedItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [modality, setModality] = useState<"all" | Modality>("all");
    const [source, setSource] = useState<SourceFilter>("all");
    const [sort, setSort] = useState<"recent" | "name" | "path">("recent");
    const [offset, setOffset] = useState(0);

    // Track which row is currently being deleted so we can disable its
    // remove button + show a spinner without blocking other rows.
    const [removingPath, setRemovingPath] = useState<string | null>(null);
    const [localStatus, setLocalStatus] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res: ListResult = await window.api.rag.listIndexed({
                modality: modality === "all" ? undefined : modality,
                source: source === "all" ? undefined : source,
                search: search.trim() || undefined,
                sort,
                limit: PAGE_SIZE,
                offset,
            });
            setItems(res.items);
            setTotal(res.total);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [modality, source, search, sort, offset]);

    useEffect(() => {
        reload();
    }, [reload]);

    // Resetting offset whenever the filters change keeps "page 5 of an
    // empty result set" from happening when the user narrows their
    // filter.
    useEffect(() => {
        setOffset(0);
    }, [search, modality, source, sort]);

    const handleOpen = async (path: string) => {
        const res = await window.api.openIndexedPath(path);
        if (!res.ok) {
            const err = (res as { error: string }).error;
            const friendly =
                err === "not_found"
                    ? "This file no longer exists at the indexed path. It may have been moved or deleted."
                    : err === "not_indexed"
                        ? "This file is not in the index anymore. Re-index its folder and try again."
                        : err === "not_a_file"
                            ? "That path is not a regular file."
                            : `Could not open file: ${err}`;
            window.alert(friendly);
        }
    };

    const handleRemove = async (item: IndexedItem) => {
        const ok = window.confirm(
            `Remove "${item.fileName}" from the index?\n\nThis only deletes Obi's index entry — the original file is not touched.`
        );
        if (!ok) return;
        setRemovingPath(item.path);
        try {
            const res = await window.api.rag.removeIndexed(item.path);
            if (res.ok) {
                setLocalStatus(
                    res.deleted
                        ? `Removed “${item.fileName}” from the index.`
                        : `“${item.fileName}” was already gone from the index.`
                );
                await reload();
            } else {
                setLocalStatus(`Could not remove: ${res.error}`);
            }
        } catch (e) {
            setLocalStatus(
                `Could not remove: ${e instanceof Error ? e.message : String(e)}`
            );
        } finally {
            setRemovingPath(null);
        }
    };

    const status = statusMessage ?? localStatus;
    const clearStatus = () => {
        setLocalStatus(null);
        onClearStatus?.();
    };

    const showingFrom = total === 0 ? 0 : offset + 1;
    const showingTo = Math.min(offset + items.length, total);
    const hasPrev = offset > 0;
    const hasNext = offset + items.length < total;

    const counts = useMemo(() => {
        const next = { all: total, text: 0, code: 0, image: 0 } as Record<string, number>;
        // Items reflect only the current page after filters; for now we
        // just show the filtered total in "All". Per-modality counts in
        // the chips help signal what's available right now without a
        // second round-trip.
        for (const it of items) next[it.modality] += 1;
        return next;
    }, [items, total]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Filter / sort bar */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                    alignItems: "center",
                    mb: 1.5,
                }}
            >
                <TextField
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by name or path…"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Icon sx={{ fontSize: 18, color: theme.palette.text.secondary }}>
                                    filter_list
                                </Icon>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ flex: 1, minWidth: 220 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Source</InputLabel>
                    <Select
                        label="Source"
                        value={source}
                        onChange={(e) => setSource(e.target.value as SourceFilter)}
                    >
                        <MenuItem value="all">All sources</MenuItem>
                        <MenuItem value="local">Local</MenuItem>
                        <MenuItem value="github">GitHub</MenuItem>
                        <MenuItem value="notion">Notion</MenuItem>
                        <MenuItem value="slack">Slack</MenuItem>
                        <MenuItem value="drive">Drive</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Sort</InputLabel>
                    <Select
                        label="Sort"
                        value={sort}
                        onChange={(e) =>
                            setSort(e.target.value as "recent" | "name" | "path")
                        }
                    >
                        <MenuItem value="recent">Most recent</MenuItem>
                        <MenuItem value="name">Name (A→Z)</MenuItem>
                        <MenuItem value="path">Path (A→Z)</MenuItem>
                    </Select>
                </FormControl>
                <Tooltip title="Refresh">
                    <span>
                        <IconButton size="small" onClick={() => reload()} disabled={loading}>
                            <Icon sx={{ fontSize: 18 }}>refresh</Icon>
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* Modality chips */}
            <Box sx={{ display: "flex", gap: 0.75, mb: 2, flexWrap: "wrap" }}>
                {MODALITY_FILTERS.map((f) => {
                    const isActive = modality === f.key;
                    const count = f.key === "all" ? total : counts[f.key] ?? 0;
                    return (
                        <Chip
                            key={f.key}
                            icon={<Icon sx={{ fontSize: "14px !important" }}>{f.icon}</Icon>}
                            label={`${f.label}${f.key !== "all" && count > 0 ? ` (${count})` : ""}`}
                            size="small"
                            onClick={() => setModality(f.key)}
                            sx={{
                                height: 26,
                                fontSize: "0.72rem",
                                fontWeight: isActive ? 700 : 500,
                                backgroundColor: isActive
                                    ? theme.palette.primary.main
                                    : alpha(theme.palette.primary.main, 0.07),
                                color: isActive
                                    ? theme.palette.primary.contrastText
                                    : theme.palette.text.secondary,
                                border: `1px solid ${isActive ? theme.palette.primary.main : theme.palette.outline.variant
                                    }`,
                                cursor: "pointer",
                                "& .MuiChip-label": { px: 1 },
                                "& .MuiChip-icon": {
                                    color: isActive
                                        ? theme.palette.primary.contrastText
                                        : theme.palette.text.secondary,
                                    ml: 0.5,
                                },
                                "&:hover": {
                                    backgroundColor: isActive
                                        ? theme.palette.primary.dark
                                        : alpha(theme.palette.primary.main, 0.12),
                                },
                            }}
                        />
                    );
                })}
            </Box>

            {/* Status message */}
            {status && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        mb: 1.5,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.outline.variant}`,
                        backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    }}
                >
                    <Typography
                        sx={{ fontSize: "0.78rem", color: theme.palette.text.primary }}
                    >
                        {status}
                    </Typography>
                    <IconButton size="small" onClick={clearStatus}>
                        <Icon sx={{ fontSize: 16 }}>close</Icon>
                    </IconButton>
                </Box>
            )}

            {error && (
                <Box
                    sx={{
                        mb: 1.5,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.error.main}`,
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                    }}
                >
                    <Typography sx={{ fontSize: "0.78rem", color: theme.palette.error.main }}>
                        Failed to load indexed files: {error}
                    </Typography>
                </Box>
            )}

            {/* Header row */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                }}
            >
                <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                    {loading
                        ? "Loading…"
                        : total === 0
                            ? "No items match your filters."
                            : `Showing ${showingFrom}–${showingTo} of ${total.toLocaleString()}`}
                </Typography>
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* List body */}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
                {loading && items.length === 0 ? (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            py: 4,
                            justifyContent: "center",
                        }}
                    >
                        <CircularProgress size={20} />
                        <Typography
                            sx={{ color: theme.palette.text.secondary, fontSize: "0.875rem" }}
                        >
                            Loading indexed files…
                        </Typography>
                    </Box>
                ) : !loading && items.length === 0 ? (
                    <EmptyState
                        icon="folder_off"
                        title="No indexed items"
                        description={
                            search || modality !== "all" || source !== "all"
                                ? "Nothing matched your filters. Try clearing them."
                                : "Index a folder from the Manage Index panel to start browsing files here."
                        }
                        action={
                            search || modality !== "all" || source !== "all"
                                ? {
                                    label: "Clear filters",
                                    onClick: () => {
                                        setSearch("");
                                        setModality("all");
                                        setSource("all");
                                    },
                                    icon: "clear",
                                }
                                : undefined
                        }
                    />
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                        {items.map((item) => (
                            <Box
                                key={`${item.modality}-${item.id}-${item.path}`}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.25,
                                    px: 1.25,
                                    py: 1,
                                    borderRadius: 1.25,
                                    border: `1px solid ${theme.palette.outline.variant}`,
                                    backgroundColor: theme.palette.surface.mid,
                                    "&:hover": {
                                        backgroundColor: theme.palette.surface.high,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: alpha(
                                            item.modality === "image"
                                                ? "#9C27B0"
                                                : item.modality === "code"
                                                    ? "#3178C6"
                                                    : theme.palette.primary.main,
                                            0.12
                                        ),
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon
                                        sx={{
                                            fontSize: 18,
                                            color:
                                                item.modality === "image"
                                                    ? "#9C27B0"
                                                    : item.modality === "code"
                                                        ? "#3178C6"
                                                        : theme.palette.primary.main,
                                        }}
                                    >
                                        {iconForModality(item.modality)}
                                    </Icon>
                                </Box>

                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.75,
                                            mb: 0.25,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: "0.85rem",
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {item.fileName}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={labelForSource(item.source)}
                                            sx={{
                                                height: 18,
                                                fontSize: "0.65rem",
                                                fontWeight: 600,
                                                backgroundColor: alpha(
                                                    theme.palette.primary.main,
                                                    0.08
                                                ),
                                                color: theme.palette.primary.main,
                                                "& .MuiChip-label": { px: 0.75 },
                                            }}
                                        />
                                    </Box>
                                    <Tooltip title={item.path}>
                                        <Typography
                                            sx={{
                                                fontSize: "0.7rem",
                                                color: theme.palette.text.secondary,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                fontFamily:
                                                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                                            }}
                                        >
                                            {truncateMiddle(item.path, 80)}
                                        </Typography>
                                    </Tooltip>
                                </Box>

                                <Typography
                                    sx={{
                                        fontSize: "0.72rem",
                                        color: theme.palette.text.secondary,
                                        flexShrink: 0,
                                        minWidth: 78,
                                        textAlign: "right",
                                    }}
                                >
                                    {formatRelative(item.indexedAtMs)}
                                </Typography>

                                <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                                    <Tooltip title="Open file">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpen(item.path)}
                                                disabled={item.source !== "local"}
                                            >
                                                <Icon sx={{ fontSize: 18 }}>open_in_new</Icon>
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Remove from index">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemove(item)}
                                                disabled={removingPath === item.path}
                                                sx={{
                                                    color: theme.palette.error.main,
                                                }}
                                            >
                                                {removingPath === item.path ? (
                                                    <CircularProgress size={14} />
                                                ) : (
                                                    <Icon sx={{ fontSize: 18 }}>delete_outline</Icon>
                                                )}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Pagination */}
            {(hasPrev || hasNext) && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: `1px solid ${theme.palette.outline.variant}`,
                    }}
                >
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                        disabled={!hasPrev || loading}
                        startIcon={<Icon>chevron_left</Icon>}
                    >
                        Previous
                    </Button>
                    <Typography
                        sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}
                    >
                        Page {Math.floor(offset / PAGE_SIZE) + 1} of{" "}
                        {Math.max(1, Math.ceil(total / PAGE_SIZE))}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setOffset((o) => o + PAGE_SIZE)}
                        disabled={!hasNext || loading}
                        endIcon={<Icon>chevron_right</Icon>}
                    >
                        Next
                    </Button>
                </Box>
            )}
        </Box>
    );
}
