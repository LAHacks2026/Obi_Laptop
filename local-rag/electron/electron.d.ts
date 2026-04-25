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
                stats: () => Promise<{
                    scanned: number
                    indexed: number
                    skipped: number
                    textIndexed: number
                    codeIndexed: number
                    imageIndexed: number
                    lastIndexedAtMs: number | null
                }>
            }

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
        }

        watcher: {
            start: (rootPath: string, options?: { includeCodeFiles?: boolean; indexAllFiles?: boolean }) => Promise<{
                status: string
                rootPath: string | null
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
            pickDirectory: (options?: { includeCodeFiles?: boolean; indexAllFiles?: boolean }) => Promise<{
                canceled: boolean
                path: string | null
                status: string
                rootPath: string | null
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
        }
    }
}

export type SidecarStatus = "stopped" | "starting" | "running" | "error";