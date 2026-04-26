import { LlamaSidecar } from "./chatSidecar.js";
import { EmbedSidecar } from "./embedSidecar.js";
import { ImageEmbedder } from "./imageEmbedder.js";
import { ImageCaptioner } from "./imageCaptioner.js";
import { VectorStore } from "./vectorStore.js";
import { FileWatcher } from "./fileWatcher.js";

export const llama = new LlamaSidecar();
export const streamAborters = new Map<number, AbortController>();
export const embedder = new EmbedSidecar();
export const imageEmbedder = new ImageEmbedder();
export const imageCaptioner = new ImageCaptioner();

export const vectorStore = new VectorStore(
    (text) => embedder.embedOne(text),
    (texts) => embedder.embedMany(texts),
    (imagePath) => imageEmbedder.embedImage(imagePath),
    (queryText) => imageEmbedder.embedText(queryText),
    768,
    512
);

export const fileWatcher = new FileWatcher(vectorStore);