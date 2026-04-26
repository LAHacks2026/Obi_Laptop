import path from "node:path";
import { app } from "electron";
import sharp from "sharp";
import {
    env,
    AutoProcessor,
    AutoTokenizer,
    CLIPTextModelWithProjection,
    CLIPVisionModelWithProjection,
    RawImage,
} from "@xenova/transformers";

const CLIP_MODEL_ID = "Xenova/clip-vit-base-patch32";
const MAX_IMAGE_EDGE_PX = 1536;

export class ImageEmbedder {
    private tokenizerPromise: Promise<Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>> | null = null;
    private processorPromise: Promise<Awaited<ReturnType<typeof AutoProcessor.from_pretrained>>> | null = null;
    private textModelPromise: Promise<CLIPTextModelWithProjection> | null = null;
    private visionModelPromise: Promise<CLIPVisionModelWithProjection> | null = null;

    constructor() {
        const cacheDir = app.isPackaged
            ? path.join(process.resourcesPath, "models", "hf-cache")
            : path.resolve(app.getAppPath(), "resources", "models", "hf-cache");

        env.allowRemoteModels = true;
        env.allowLocalModels = true;
        env.useBrowserCache = false;
        env.cacheDir = cacheDir;

        // Quieten ONNX Runtime: only emit errors, not the noisy "Removing initializer" warnings
        // that flood Electron logs and can themselves contribute to crashes under pressure.
        const backends = (env as unknown as { backends?: { onnx?: { logSeverityLevel?: number } } }).backends;
        if (backends?.onnx) {
            backends.onnx.logSeverityLevel = 3; // 0=verbose, 1=info, 2=warn, 3=error, 4=fatal
        }
    }

    async embedImage(imagePath: string): Promise<number[]> {
        const startedAt = Date.now();
        console.log("[imageEmbedder] embedImage start:", imagePath);
        const processor = await this.getProcessor();
        const visionModel = await this.getVisionModel();
        const imageInput = await this.prepareImageInput(imagePath);
        const image = await RawImage.read(imageInput);
        const imageInputs = await processor(image);
        const output = await visionModel(imageInputs) as { image_embeds: { data: Float32Array | number[] } };
        const vector = Array.from(output.image_embeds.data);
        console.log(
            "[imageEmbedder] embedImage ok:",
            imagePath,
            `dim=${vector.length}`,
            `tookMs=${Date.now() - startedAt}`
        );
        return vector;
    }

    async embedText(text: string): Promise<number[]> {
        const startedAt = Date.now();
        const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
        console.log("[imageEmbedder] embedText start:", preview);
        const tokenizer = await this.getTokenizer();
        const textModel = await this.getTextModel();
        const textInputs = tokenizer([text], { padding: true, truncation: true });
        const output = await textModel(textInputs) as { text_embeds: { data: Float32Array | number[] } };
        const vector = Array.from(output.text_embeds.data);
        console.log(
            "[imageEmbedder] embedText ok:",
            `dim=${vector.length}`,
            `tookMs=${Date.now() - startedAt}`
        );
        return vector;
    }

    private async getTokenizer() {
        if (!this.tokenizerPromise) {
            console.log("[imageEmbedder] loading CLIP tokenizer (one-time)");
            this.tokenizerPromise = AutoTokenizer.from_pretrained(CLIP_MODEL_ID).catch((error) => {
                this.tokenizerPromise = null;
                throw error;
            });
        }
        return this.tokenizerPromise;
    }

    private async getProcessor() {
        if (!this.processorPromise) {
            console.log("[imageEmbedder] loading CLIP processor (one-time)");
            this.processorPromise = AutoProcessor.from_pretrained(CLIP_MODEL_ID).catch((error) => {
                this.processorPromise = null;
                throw error;
            });
        }
        return this.processorPromise;
    }

    private async getTextModel() {
        if (!this.textModelPromise) {
            console.log("[imageEmbedder] loading CLIP text model (one-time)");
            this.textModelPromise = CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, {
                quantized: true,
            }).catch((error) => {
                this.textModelPromise = null;
                throw error;
            });
        }
        return this.textModelPromise;
    }

    private async getVisionModel() {
        if (!this.visionModelPromise) {
            console.log("[imageEmbedder] loading CLIP vision model (one-time)");
            this.visionModelPromise = CLIPVisionModelWithProjection.from_pretrained(CLIP_MODEL_ID, {
                quantized: true,
            }).catch((error) => {
                this.visionModelPromise = null;
                throw error;
            });
        }
        return this.visionModelPromise;
    }

    private async prepareImageInput(imagePath: string): Promise<string | Buffer> {
        try {
            const metadata = await sharp(imagePath).metadata();
            const width = metadata.width ?? 0;
            const height = metadata.height ?? 0;
            if (width <= MAX_IMAGE_EDGE_PX && height <= MAX_IMAGE_EDGE_PX) {
                return imagePath;
            }

            // Large images can spike ONNX memory and crash the process; clamp before embedding.
            const resized = await sharp(imagePath)
                .rotate()
                .resize({
                    width: MAX_IMAGE_EDGE_PX,
                    height: MAX_IMAGE_EDGE_PX,
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .png()
                .toBuffer();
            return resized;
        } catch (error) {
            console.warn("[imageEmbedder] failed to preprocess image, using original:", imagePath, error);
            return imagePath;
        }
    }
}

