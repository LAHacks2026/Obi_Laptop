import path from "node:path";
import { app } from "electron";
import {
    env,
    AutoProcessor,
    AutoTokenizer,
    CLIPTextModelWithProjection,
    CLIPVisionModelWithProjection,
    RawImage,
} from "@xenova/transformers";

const CLIP_MODEL_ID = "Xenova/clip-vit-base-patch32";

export class ImageEmbedder {
    private tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null = null;
    private processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> | null = null;
    private textModel: CLIPTextModelWithProjection | null = null;
    private visionModel: CLIPVisionModelWithProjection | null = null;

    constructor() {
        const cacheDir = app.isPackaged
            ? path.join(process.resourcesPath, "models", "hf-cache")
            : path.resolve(app.getAppPath(), "resources", "models", "hf-cache");

        env.allowRemoteModels = true;
        env.allowLocalModels = true;
        env.useBrowserCache = false;
        env.cacheDir = cacheDir;
    }

    async embedImage(imagePath: string): Promise<number[]> {
        const processor = await this.getProcessor();
        const visionModel = await this.getVisionModel();
        const image = await RawImage.read(imagePath);
        const imageInputs = await processor(image);
        const output = await visionModel(imageInputs) as { image_embeds: { data: Float32Array | number[] } };
        return Array.from(output.image_embeds.data);
    }

    async embedText(text: string): Promise<number[]> {
        const tokenizer = await this.getTokenizer();
        const textModel = await this.getTextModel();
        const textInputs = tokenizer([text], { padding: true, truncation: true });
        const output = await textModel(textInputs) as { text_embeds: { data: Float32Array | number[] } };
        return Array.from(output.text_embeds.data);
    }

    private async getTokenizer() {
        if (!this.tokenizer) {
            this.tokenizer = await AutoTokenizer.from_pretrained(CLIP_MODEL_ID);
        }
        return this.tokenizer;
    }

    private async getProcessor() {
        if (!this.processor) {
            this.processor = await AutoProcessor.from_pretrained(CLIP_MODEL_ID);
        }
        return this.processor;
    }

    private async getTextModel() {
        if (!this.textModel) {
            this.textModel = await CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, { quantized: true });
        }
        return this.textModel;
    }

    private async getVisionModel() {
        if (!this.visionModel) {
            this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(CLIP_MODEL_ID, { quantized: true });
        }
        return this.visionModel;
    }
}

