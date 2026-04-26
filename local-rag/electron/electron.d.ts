export { }

declare global {
    interface Window {
        api: {
            rag: {
                search: (
                    query: string,
                    limit?: number
                ) => Promise<
                    Array<{
                        chunkId: number
                        documentPath: string
                        fileName: string
                        content: string
                        distance: number
                        modality?: "text" | "image"
                        sectionTitle?: string
                    }>
                >
                deleteDocument: (filePath: string) => Promise<{ deleted: boolean }>
                describeImage: (imagePath: string) => Promise<string>
                answerImageQuestion: (imagePath: string, question: string) => Promise<string>
                extractImageText: (imagePath: string) => Promise<string>
                detectImageObjects: (imagePath: string) => Promise<string[]>
                getImagePreviewDataUrl: (imagePath: string) => Promise<string | null>
                getSourcePreview: (filePath: string) => Promise<{
                    kind: "image" | "text" | "binary" | "unavailable"
                    imageDataUrl: string | null
                    text: string | null
                }>
                stats: () => Promise<{
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }>
                recentIndexedFiles: (limit?: number) => Promise<Array<{
                    path: string
                    fileName: string
                    indexedAtMs: number
                    updatedAtMs: number
                    indexCount: number
                    modality: "text" | "code" | "image"
                }>>
            }

            openIndexedPath: (
                filePath: string
            ) => Promise<{ ok: true } | { ok: false; error: string }>

            embedder: {
                start: () => Promise<{
                    status: string
                    port: number
                    baseUrl: string
                }>
                stop: () => Promise<{
                    status: string
                    port: number
                    baseUrl: string
                }>
                status: () => Promise<{
                    status: string
                    port: number
                    baseUrl: string
                }>
            }

            gmail: {
                status: () => Promise<{
                    connected: boolean
                    syncing: boolean
                    lastError: string | null
                    indexedCount: number
                    lastSyncedAtMs: number | null
                }>
                syncMetadata: (limit?: number) => Promise<{ synced: number; skipped: number }>
                clearIndex: () => Promise<{ cleared: number }>
            }
        }

        watcher: {
            start: (rootPath: string | string[], options?: { includeCodeFiles?: boolean; indexAllFiles?: boolean }) => Promise<{
                status: string
                rootPath: string | null
                rootPaths: string[]
                indexingOptions: { includeCodeFiles: boolean; indexAllFiles: boolean }
                indexingStats: {
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }
            }>
            stop: () => Promise<{
                status: string
                rootPath: string | null
                rootPaths: string[]
                indexingOptions: { includeCodeFiles: boolean; indexAllFiles: boolean }
                indexingStats: {
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }
            }>
            status: () => Promise<{
                status: string
                rootPath: string | null
                rootPaths: string[]
                indexingOptions: { includeCodeFiles: boolean; indexAllFiles: boolean }
                indexingStats: {
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }
            }>
            pickDirectory: (options?: { includeCodeFiles?: boolean; indexAllFiles?: boolean }, addToExisting?: boolean) => Promise<{
                canceled: boolean
                path: string | null
                status: string
                rootPath: string | null
                rootPaths: string[]
                indexingOptions: { includeCodeFiles: boolean; indexAllFiles: boolean }
                indexingStats: {
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }
            }>
            clearIndex: () => Promise<{
                status: string
                rootPath: string | null
                rootPaths: string[]
                indexingOptions: { includeCodeFiles: boolean; indexAllFiles: boolean }
                indexingStats: {
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }
            }>
            reindex: () => Promise<{
                status: string
                rootPath: string | null
                rootPaths: string[]
                indexingOptions: { includeCodeFiles: boolean; indexAllFiles: boolean }
                indexingStats: {
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }
                warning?: "no_root_path"
            }>
        }
    }
}

export type SidecarStatus = "stopped" | "starting" | "running" | "error";