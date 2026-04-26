import { contextBridge, ipcRenderer } from "electron";

type Msg = { role: "system" | "user" | "assistant"; content: string };

type StreamStartedPayload = { requestId: string };
type StreamDeltaPayload = { requestId: string; delta: string };
type StreamDonePayload = { requestId: string };
type StreamErrorPayload = { requestId: string; error: string };

contextBridge.exposeInMainWorld("llama", {
    // lifecycle APIs
    start: () => ipcRenderer.invoke("llama:start"),
    status: () => ipcRenderer.invoke("llama:status"),
    stop: () => ipcRenderer.invoke("llama:stop"),

    // Chat Streaming controls
    chatStreamStart: (params: { requestId: string; messages: Msg[]; temperature?: number }) =>
        ipcRenderer.send("llama:chat_stream_start", params),

    chatStreamCancel: () => ipcRenderer.send("llama:chat_stream_cancel"),

    // Chat Streaming events
    onChatStreamDelta: (cb: (payload: StreamDeltaPayload) => void) => {
        const handler = (_: unknown, payload: StreamDeltaPayload) => cb(payload);
        ipcRenderer.on("llama:chat_stream_delta", handler);
        return () => ipcRenderer.removeListener("llama:chat_stream_delta", handler);
    },

    onChatStreamDone: (cb: (payload: StreamDonePayload) => void) => {
        const handler = (_: unknown, payload: StreamDonePayload) => cb(payload);
        ipcRenderer.on("llama:chat_stream_done", handler);
        return () => ipcRenderer.removeListener("llama:chat_stream_done", handler);
    },

    onChatStreamError: (cb: (payload: StreamErrorPayload) => void) => {
        const handler = (_: unknown, payload: StreamErrorPayload) => cb(payload);
        ipcRenderer.on("llama:chat_stream_error", handler);
        return () => ipcRenderer.removeListener("llama:chat_stream_error", handler);
    },

    onToolCallDelta: (cb: (payload: StreamDeltaPayload) => void) => {
        const handler = (_: unknown, payload: StreamDeltaPayload) => cb(payload);
        ipcRenderer.on("llama:tool_call_delta", handler);
        return () => ipcRenderer.removeListener("llama:tool_call_delta", handler);
    }
});

contextBridge.exposeInMainWorld("api", {
    rag: {
        indexDirectory: (rootPath: string) =>
            ipcRenderer.invoke("rag:indexDirectory", rootPath),

        indexFile: (filePath: string) =>
            ipcRenderer.invoke("rag:indexFile", filePath),

        search: (query: string, limit?: number) =>
            ipcRenderer.invoke("rag:search", query, limit),
        describeImage: (imagePath: string) =>
            ipcRenderer.invoke("rag:describeImage", imagePath),
        answerImageQuestion: (imagePath: string, question: string) =>
            ipcRenderer.invoke("rag:answerImageQuestion", imagePath, question),
        extractImageText: (imagePath: string) =>
            ipcRenderer.invoke("rag:extractImageText", imagePath),
        detectImageObjects: (imagePath: string) =>
            ipcRenderer.invoke("rag:detectImageObjects", imagePath),
        getImagePreviewDataUrl: (imagePath: string) =>
            ipcRenderer.invoke("rag:getImagePreviewDataUrl", imagePath),
        getSourcePreview: (filePath: string) =>
            ipcRenderer.invoke("rag:getSourcePreview", filePath),
        stats: () =>
            ipcRenderer.invoke("rag:stats"),
    },

    openIndexedPath: (filePath: string) =>
        ipcRenderer.invoke("shell:openIndexedPath", filePath) as Promise<
            { ok: true } | { ok: false; error: string }
        >,

    embedder: {
        start: () => ipcRenderer.invoke("embedder:start"),
        stop: () => ipcRenderer.invoke("embedder:stop"),
        status: () => ipcRenderer.invoke("embedder:status"),
    },
})

contextBridge.exposeInMainWorld("watcher", {
    start: (rootPath: string, options?: { includeCodeFiles?: boolean; indexAllFiles?: boolean }) => ipcRenderer.invoke("watcher:start", rootPath, options),
    stop: () => ipcRenderer.invoke("watcher:stop"),
    status: () => ipcRenderer.invoke("watcher:status"),
    pickDirectory: (options?: { includeCodeFiles?: boolean; indexAllFiles?: boolean }) => ipcRenderer.invoke("watcher:pickDirectory", options),
})