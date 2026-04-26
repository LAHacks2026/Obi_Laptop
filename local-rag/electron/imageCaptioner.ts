import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { env, pipeline } from "@xenova/transformers";

const IMAGE_CAPTION_MODEL_ID = "Xenova/vit-gpt2-image-captioning";
const IMAGE_VQA_MODEL_ID = "Xenova/donut-base-finetuned-docvqa";
const IMAGE_OCR_MODEL_ID = "Xenova/trocr-base-printed";
const IMAGE_OBJECT_MODEL_ID = "Xenova/detr-resnet-50";

type CaptionPipeline = Awaited<ReturnType<typeof pipeline>>;
type VqaPipeline = Awaited<ReturnType<typeof pipeline>>;
type OcrPipeline = Awaited<ReturnType<typeof pipeline>>;
type ObjectDetectionPipeline = Awaited<ReturnType<typeof pipeline>>;
type CacheEntry = {
    updatedAtMs: number;
    caption: string;
};
type OcrCacheEntry = {
    updatedAtMs: number;
    text: string;
};
type ObjectCacheEntry = {
    updatedAtMs: number;
    labels: string[];
};

export class ImageCaptioner {
    private captioner: CaptionPipeline | null = null;
    private vqaModel: VqaPipeline | null = null;
    private ocrModel: OcrPipeline | null = null;
    private objectDetector: ObjectDetectionPipeline | null = null;
    private vqaDisabled = false;
    private objectDetectionDisabled = false;
    private readonly cache = new Map<string, CacheEntry>();
    private readonly ocrCache = new Map<string, OcrCacheEntry>();
    private readonly objectCache = new Map<string, ObjectCacheEntry>();

    constructor() {
        const cacheDir = app.isPackaged
            ? path.join(process.resourcesPath, "models", "hf-cache")
            : path.resolve(app.getAppPath(), "resources", "models", "hf-cache");

        env.allowRemoteModels = true;
        env.allowLocalModels = true;
        env.useBrowserCache = false;
        env.cacheDir = cacheDir;
    }

    async describeImage(imagePath: string): Promise<string> {
        const stat = fs.statSync(imagePath);
        const updatedAtMs = Math.trunc(stat.mtimeMs);
        const cached = this.cache.get(imagePath);
        if (cached && cached.updatedAtMs === updatedAtMs) {
            return cached.caption;
        }

        const captionPipeline = await this.getCaptioner();
        const output = await captionPipeline(imagePath, {
            max_new_tokens: 48,
        }) as Array<{ generated_text?: string }>;

        const caption = output?.[0]?.generated_text?.trim() ?? "";
        if (!caption) {
            throw new Error(`Image caption model returned empty output for: ${imagePath}`);
        }

        this.cache.set(imagePath, { updatedAtMs, caption });
        return caption;
    }

    async answerQuestion(imagePath: string, question: string): Promise<string> {
        const normalizedQuestion = question.trim();
        if (!normalizedQuestion) {
            throw new Error("Question must not be empty.");
        }
        if (this.vqaDisabled) return "";

        try {
            const vqa = await this.getVqaModel();
            const outputs = await vqa(imagePath, normalizedQuestion, { topk: 3 }) as Array<{
                answer?: string;
                score?: number;
            }>;
            const top = outputs?.[0];
            const answer = top?.answer?.trim();
            if (!answer) return "";

            const confidence = typeof top?.score === "number"
                ? ` (confidence ${Math.max(0, Math.min(1, top.score)).toFixed(2)})`
                : "";

            return `${answer}${confidence}`;
        } catch (error) {
            // Avoid repeated noisy errors if model/pipeline is incompatible in this runtime.
            this.vqaDisabled = true;
            console.warn("[imageCaptioner] VQA disabled, falling back to caption + OCR only:", error);
            return "";
        }
    }

    async extractText(imagePath: string): Promise<string> {
        const stat = fs.statSync(imagePath);
        const updatedAtMs = Math.trunc(stat.mtimeMs);
        const cached = this.ocrCache.get(imagePath);
        if (cached && cached.updatedAtMs === updatedAtMs) {
            return cached.text;
        }

        const ocr = await this.getOcrModel();
        const candidates = await this.buildOcrCandidates(imagePath);
        let text = "";
        try {
            for (const candidatePath of candidates) {
                const output = await ocr(candidatePath, { max_new_tokens: 128 }) as Array<{ generated_text?: string }>;
                const candidateText = output?.[0]?.generated_text?.replace(/\s+/g, " ").trim() ?? "";
                if (this.scoreOcrText(candidateText) > this.scoreOcrText(text)) {
                    text = candidateText;
                }
            }
        } finally {
            for (const candidatePath of candidates) {
                if (candidatePath === imagePath) continue;
                fs.promises.unlink(candidatePath).catch(() => { });
            }
        }
        this.ocrCache.set(imagePath, { updatedAtMs, text });
        return text;
    }

    async detectObjects(imagePath: string): Promise<string[]> {
        const stat = fs.statSync(imagePath);
        const updatedAtMs = Math.trunc(stat.mtimeMs);
        const cached = this.objectCache.get(imagePath);
        if (cached && cached.updatedAtMs === updatedAtMs) {
            return cached.labels;
        }
        if (this.objectDetectionDisabled) return [];

        try {
            const detector = await this.getObjectDetector();
            const detections = await detector(imagePath, {
                threshold: 0.35,
                percentage: true,
            }) as Array<{ label?: string; score?: number }>;

            const bestByLabel = new Map<string, number>();
            for (const detection of detections) {
                const label = detection.label?.trim().toLowerCase();
                if (!label) continue;
                const score = typeof detection.score === "number" ? detection.score : 0;
                const prev = bestByLabel.get(label) ?? 0;
                if (score > prev) bestByLabel.set(label, score);
            }

            const labels = Array.from(bestByLabel.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([label]) => label);
            this.objectCache.set(imagePath, { updatedAtMs, labels });
            return labels;
        } catch (error) {
            this.objectDetectionDisabled = true;
            console.warn("[imageCaptioner] Object detection disabled due to runtime error:", error);
            return [];
        }
    }

    private async getCaptioner() {
        if (!this.captioner) {
            this.captioner = await pipeline("image-to-text", IMAGE_CAPTION_MODEL_ID, {
                quantized: true,
            });
        }
        return this.captioner;
    }

    private async getVqaModel() {
        if (!this.vqaModel) {
            this.vqaModel = await pipeline("document-question-answering", IMAGE_VQA_MODEL_ID, {
                quantized: true,
            });
        }
        return this.vqaModel;
    }

    private async getOcrModel() {
        if (!this.ocrModel) {
            this.ocrModel = await pipeline("image-to-text", IMAGE_OCR_MODEL_ID, {
                quantized: true,
            });
        }
        return this.ocrModel;
    }

    private async getObjectDetector() {
        if (!this.objectDetector) {
            this.objectDetector = await pipeline("object-detection", IMAGE_OBJECT_MODEL_ID, {
                quantized: true,
            });
        }
        return this.objectDetector;
    }

    private scoreOcrText(text: string): number {
        const normalized = text.replace(/\s+/g, " ").trim();
        if (!normalized) return 0;
        const alphaNumMatches = normalized.match(/[A-Za-z0-9]/g) ?? [];
        const alphaNumCount = alphaNumMatches.length;
        const uniqueChars = new Set(alphaNumMatches.map((c) => c.toLowerCase())).size;
        const wordCount = normalized.split(/\s+/).filter(Boolean).length;
        return alphaNumCount + uniqueChars + wordCount * 2;
    }

    private async buildOcrCandidates(imagePath: string): Promise<string[]> {
        // Keep runtime robust in Electron bundles: avoid native image preprocessing deps.
        // We can expand this later with a pure-JS preprocessing path if needed.
        return [imagePath];
    }
}

