import { LlamaSidecar } from "./chatSidecar.js";
import { EmbedSidecar } from "./embedSidecar.js";
import { VectorStore } from "./vectorStore.js";
import { FileWatcher } from "./fileWatcher.js";

export const llama = new LlamaSidecar();
export const streamAborters = new Map<number, AbortController>();
export const embedder = new EmbedSidecar();

export const vectorStore = new VectorStore(
    (text) => embedder.embedOne(text),
    (texts) => embedder.embedMany(texts),
    768
);

export const fileWatcher = new FileWatcher(vectorStore);