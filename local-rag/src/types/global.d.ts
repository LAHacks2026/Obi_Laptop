export { };

type ChatRole = "system" | "user" | "assistant" | "tool";

export type Msg = {
    role: ChatRole;
    content: string;
    toolCalls?: ToolCall[];
};

export type ToolCall = {
    id?: string;
    index: number;
    type?: "function";
    function?: {
        name?: string;
        arguments?: string;
    };
};

export type SearchResult = {
    chunkId: number
    documentPath: string
    fileName: string
    content: string
    distance: number
    modality?: "text" | "image"
    sectionTitle?: string
}

export type SidecarStatus = "stopped" | "starting" | "running" | "error";

export type LlamaStatus = {
    status: SidecarStatus;
    port: number;
    baseUrl: string;
    modelType: string;
};

export interface LlamaApi {
    // Lifecycle
    start(): Promise<LlamaStatus>;
    status(): Promise<LlamaStatus>;
    stop(): Promise<LlamaStatus>;

    // Chat Streaming controls
    chatStreamStart(params: {
        requestId: string;
        messages: Msg[];
        temperature?: number;
    }): void;

    chatStreamCancel(): void;

    // Chat Streaming Events
    onChatStreamDelta(
        cb: (payload: { requestId: string; delta: string }) => void
    ): () => void;

    onToolCallDelta(
        cb: (payload: { requestId: string; delta; string }) => void
    ): () => void;

    onChatStreamDone(
        cb: (payload: { requestId: string }) => void
    ): () => void;

    onChatStreamError(
        cb: (payload: { requestId: string; error: string }) => void
    ): () => void;
}

declare global {
    interface Window {
        llama: LlamaApi;

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
                imageEmbeddingStatus: () => Promise<{
                    imageDocCount: number
                    imageEmbeddingCount: number
                    expectedDimensions: number
                    queryEmbeddingDim: number | null
                    queryEmbeddingError: string | null
                    sampleImage: { path: string; file_name: string } | null
                    isWorking: boolean
                }>
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
            clearIndex: () => Promise<{
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
            reindex: () => Promise<{
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
                warning?: "no_root_path"
            }>
        }
    }
}