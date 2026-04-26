import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { app } from "electron";
import { env, pipeline } from "@xenova/transformers";

const IMAGE_CAPTION_MODEL_ID = "Xenova/vit-gpt2-image-captioning";
const IMAGE_VQA_MODEL_ID = "Xenova/donut-base-finetuned-docvqa";
const OCR_MODEL_IDS = [
    "Xenova/trocr-base-printed",
    "Xenova/trocr-small-printed",
    "Xenova/trocr-base-handwritten",
] as const;
const IMAGE_OBJECT_MODEL_ID = "Xenova/detr-resnet-50";
const DOC_QA_TRANSCRIBE_PROMPTS = [
    "Transcribe all visible text exactly.",
    "What is all the text in this image? Return only the text.",
    "Read the full paragraph text in this image.",
] as const;
const execFileAsync = promisify(execFile);

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
    private readonly ocrModels = new Map<string, OcrPipeline>();
    private objectDetector: ObjectDetectionPipeline | null = null;
    private vqaDisabled = false;
    private objectDetectionDisabled = false;
    private tesseractUnavailable = false;
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
            // Multi-pass OCR: try multiple local OCR models and token budgets.
            for (const modelId of OCR_MODEL_IDS) {
                let model: OcrPipeline;
                try {
                    model = await this.getOcrModel(modelId);
                } catch {
                    continue;
                }
                for (const candidatePath of candidates) {
                    for (const maxTokens of [64, 128, 192]) {
                        const output = await model(candidatePath, { max_new_tokens: maxTokens }) as Array<{ generated_text?: string }>;
                        const candidateText = output?.[0]?.generated_text?.replace(/\s+/g, " ").trim() ?? "";
                        if (this.scoreOcrText(candidateText) > this.scoreOcrText(text)) {
                            text = candidateText;
                        }
                    }
                }
            }

            const docQaText = await this.extractTextViaDocumentQa(imagePath);
            if (this.scoreOcrText(docQaText) > this.scoreOcrText(text)) {
                text = docQaText;
            } else if (docQaText) {
                text = this.mergeTextCandidates(text, docQaText);
            }

            const tesseractText = await this.extractTextViaTesseract(imagePath);
            if (this.scoreOcrText(tesseractText) > this.scoreOcrText(text)) {
                text = tesseractText;
            } else if (tesseractText) {
                text = this.mergeTextCandidates(text, tesseractText);
            }
        } catch (error) {
            console.warn("[imageCaptioner] OCR pass failed, returning best known text so far:", error);
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

    private async getOcrModel(modelId: string) {
        const cached = this.ocrModels.get(modelId);
        if (cached) return cached;
        try {
            const created = await pipeline("image-to-text", modelId, {
                quantized: true,
            });
            this.ocrModels.set(modelId, created);
            return created;
        } catch (error) {
            // Skip unavailable models and continue with other OCR passes.
            console.warn(`[imageCaptioner] OCR model unavailable: ${modelId}`, error);
            throw error;
        }
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
        const sentenceMarks = (normalized.match(/[.!?]/g) ?? []).length;
        const lowerCaseCount = (normalized.match(/[a-z]/g) ?? []).length;
        const upperCaseCount = (normalized.match(/[A-Z]/g) ?? []).length;
        const capsPenalty = upperCaseCount > 0 && lowerCaseCount === 0 ? 10 : 0;
        return alphaNumCount + uniqueChars + wordCount * 3 + sentenceMarks * 6 - capsPenalty;
    }

    private async buildOcrCandidates(imagePath: string): Promise<string[]> {
        // Keep runtime robust in Electron bundles: avoid native image preprocessing deps.
        // We can expand this later with a pure-JS preprocessing path if needed.
        return [imagePath];
    }

    private async extractTextViaDocumentQa(imagePath: string): Promise<string> {
        if (this.vqaDisabled) return "";
        let vqa: VqaPipeline;
        try {
            vqa = await this.getVqaModel();
        } catch {
            return "";
        }

        const outputs: string[] = [];
        for (const prompt of DOC_QA_TRANSCRIBE_PROMPTS) {
            try {
                const answer = await vqa(imagePath, prompt, { topk: 1 }) as Array<{ answer?: string }>;
                const text = answer?.[0]?.answer?.replace(/\s+/g, " ").trim() ?? "";
                if (text) outputs.push(text);
            } catch {
                // Keep trying other prompts.
            }
        }

        return outputs
            .sort((a, b) => this.scoreOcrText(b) - this.scoreOcrText(a))[0] ?? "";
    }

    private mergeTextCandidates(primary: string, secondary: string): string {
        const a = primary.replace(/\s+/g, " ").trim();
        const b = secondary.replace(/\s+/g, " ").trim();
        if (!a) return b;
        if (!b) return a;
        if (a.includes(b)) return a;
        if (b.includes(a)) return b;

        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = b.toLowerCase().split(/\s+/);
        const novelty = wordsB.filter((word) => !wordsA.has(word));
        if (novelty.length < 4) return a;
        return `${a}\n${b}`.trim();
    }

    private async extractTextViaTesseract(imagePath: string): Promise<string> {
        if (this.tesseractUnavailable) return "";
        try {
            const { stdout } = await execFileAsync("tesseract", [imagePath, "stdout", "--oem", "1", "--psm", "6"]);
            return String(stdout ?? "").replace(/\s+/g, " ").trim();
        } catch (error: any) {
            const message = String(error?.message ?? error);
            // Avoid repeated process spawn failures when binary is unavailable.
            if (message.includes("ENOENT") || message.toLowerCase().includes("not found")) {
                this.tesseractUnavailable = true;
                console.warn("[imageCaptioner] tesseract CLI not available; skipping this OCR fallback.");
                return "";
            }
            console.warn("[imageCaptioner] tesseract OCR failed:", error);
            return "";
        }
    }
}

