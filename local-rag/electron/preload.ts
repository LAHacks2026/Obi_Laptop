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
    },

    embedder: {
        start: () => ipcRenderer.invoke("embedder:start"),
        stop: () => ipcRenderer.invoke("embedder:stop"),
        status: () => ipcRenderer.invoke("embedder:status"),
    },
})

contextBridge.exposeInMainWorld("watcher", {
    start: (rootPath: string) => ipcRenderer.invoke("watcher:start", rootPath),
    stop: () => ipcRenderer.invoke("watcher:stop"),
    status: () => ipcRenderer.invoke("watcher:status"),
    pickDirectory: () => ipcRenderer.invoke("watcher:pickDirectory"),
})