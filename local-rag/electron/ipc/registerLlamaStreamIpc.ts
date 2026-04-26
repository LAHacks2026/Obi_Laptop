import { ipcMain } from "electron";
import { llama, streamAborters } from "../services.js";
import { weatherTools } from "../tools/tools";
import { ToolCallAccumulator } from "../tools/ToolCallAccumulator.js";
import { executeToolCalls } from "../tools/executeToolCalls.js";

/* -- Chat Model Streaming IPC -----------------------
    steamAborters: { webContent.id : AbortController}
    ------------------------------------------------------
    llama:chat_stream_start
    ARGS
    - requestId: For React to match deltas (Determines which page the stream gets rendered to)
    - messages: Chat history
    - temperature: Model temp, refer to chatModelTemperature
    ------------------------------------------------------
    llama:chat_stream_cancel
    DESC
    - React calls ipcRenderer => emits llama:chat_stream_cancel to abort stream
*/
const chatModelTemperature = 0.4;

export function registerLlamaStreamIpc() {
    ipcMain.on("llama:chat_stream_start", async (event, { requestId, messages, temperature }) => {
        console.log(messages); // debug

        // Registoring the webContent ID to allow the ability to cancel per stream
        const wcId = event.sender.id;
        const ac = new AbortController();
        streamAborters.set(wcId, ac);

        const toolAccumulator = new ToolCallAccumulator();

        try {
            const llamaStatus = llama.getStatus();
            if (llamaStatus.status !== "running" || !llamaStatus.baseUrl) {
                event.sender.send("llama:chat_stream_error", {
                    requestId,
                    error: `Local AI is not running (status: ${llamaStatus.status}). Check that model files are present in resources/models/ and restart Obi.`,
                });
                streamAborters.delete(wcId);
                return;
            }

            // Start fetch to local server with "stream: true" (SSE)
            const chatPort = llamaStatus.baseUrl;
            const res = await fetch(`${chatPort}/v1/chat/completions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: ac.signal,
                body: JSON.stringify({
                    model: "local-model",
                    messages,
                    tools: weatherTools,
                    temperature: temperature ?? chatModelTemperature,
                    stream: true,
                }),
            });

            // If fetch request fails, send error to renderer
            if (!res.ok || !res.body) {
                const txt = await res.text().catch(() => "");
                console.error(`[llama:stream] HTTP ${res.status}: ${txt}`);
                event.sender.send("llama:chat_stream_error", {
                    requestId,
                    error: `Local AI returned HTTP ${res.status}. The model may still be loading — try again in a moment.`,
                });
                streamAborters.delete(wcId);
                return;
            }

            // Read SSE text stream
            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            // Stream is bytes => decode to text => parse SSE frames
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true }); // decode to text

                // SSE frames separated by \n\n
                let idx;
                while ((idx = buffer.indexOf("\n\n")) !== -1) {
                    const frame = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);

                    // SSE lines: "data: {...}"
                    for (const line of frame.split("\n")) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith("data:")) continue;

                        const data = trimmed.slice(5).trim();
                        if (!data) continue;

                        if (data === "[DONE]") {
                            const finalToolCalls = toolAccumulator.getAll();
                            await executeToolCalls(finalToolCalls);
                            return;
                        }

                        // parse JSON chunk (OpenAI-style)
                        try {
                            const json = JSON.parse(data);
                            const choice = json?.choices?.[0];
                            const delta = choice?.delta;

                            const textDelta = delta?.content;
                            if (textDelta) {
                                event.sender.send("llama:chat_stream_delta", { requestId, delta: textDelta });
                            }

                            /* 
                            const toolCalls = delta?.tool_calls;
                            if (toolCalls) {
                                toolAccumulator.addDeltas(toolCalls);
                                event.sender.send("llama:tool_call_delta", { requestId, toolCalls }); // sends to renderer
                            }
                            */
                        } catch (err) {
                            // ignore malformed chunk
                            console.warn("Malformed SSE JSON: ", data, err);
                        }
                    }
                }
            }
        } catch (e: any) {
            if (e?.name !== "AbortError") {
                console.error("[llama:stream] error:", e?.message ?? e);
                event.sender.send("llama:chat_stream_error", {
                    requestId,
                    error: e?.message ?? String(e),
                });
            }
        } finally {
            // Fires on every exit path: [DONE] return, natural stream end, error, or abort.
            // The renderer ignores duplicates (isGenerating false→false is a no-op).
            event.sender.send("llama:chat_stream_done", { requestId });
            streamAborters.delete(event.sender.id);
        }
    });

    ipcMain.on("llama:chat_stream_cancel", (event) => {
        const ac = streamAborters.get(event.sender.id);
        if (ac) ac.abort();
        streamAborters.delete(event.sender.id);
    });
}