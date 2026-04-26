import chokidar, { FSWatcher } from "chokidar"
import path from "node:path"
import { fileURLToPath } from "node:url";
import { VectorStore } from "./vectorStore"
import { SidecarStatus } from "./electron"
import { IndexingOptions, IndexingRules } from "./indexingRules";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileWatcher {
    private watcher: FSWatcher | null = null
    private rootPath: string | null = null
    private status: SidecarStatus = "stopped"
    private indexingRules: IndexingRules | null = null;
    private indexingOptions: Required<IndexingOptions> = { includeCodeFiles: false, indexAllFiles: false };

    constructor(private readonly vectorStore: VectorStore) { }

    async setPath(newRootPath: string, options: IndexingOptions = {}) {
        if (this.rootPath === newRootPath) return this.getStatus()
        await this.start(newRootPath, options)
        return this.getStatus()
    }

    async start(rootPath: string, options: IndexingOptions = {}) {
        if (this.watcher) {
            await this.stop()
        }

        this.status = "starting"
        this.rootPath = rootPath
        this.indexingOptions = {
            includeCodeFiles: options.includeCodeFiles ?? false,
            indexAllFiles: options.indexAllFiles ?? false,
        };
        this.indexingRules = new IndexingRules(rootPath, this.indexingOptions);

        const rules = this.indexingRules;
        try {
            await this.vectorStore.indexDirectory(rootPath, this.indexingOptions);
        } catch (error) {
            this.status = "error"
            console.error("[fileWatcher] initial indexing failed:", error)
            return
        }

        this.watcher = chokidar.watch(rootPath, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100,
            },
            ignored: (targetPath, stats) => {
                if (!rules) return false;
                if (stats?.isDirectory()) {
                    return rules.shouldSkipDirectory(targetPath);
                }
                return rules.shouldSkipFile(targetPath);
            },
        })

        this.watcher.on("add", async (filePath) => {
            if (!shouldIndexFile(filePath, rules)) return
            try {
                const modality = rules.getFileModality(filePath);
                await this.vectorStore.indexFile(filePath, modality ?? undefined)
                console.log("[fileWatcher] indexed added file:", filePath)
            } catch (error) {
                this.status = "error";
                console.error("[fileWatcher] add failed:", filePath, error)
            }
        })

        this.watcher.on("change", async (filePath) => {
            if (!shouldIndexFile(filePath, rules)) return
            try {
                const modality = rules.getFileModality(filePath);
                await this.vectorStore.indexFile(filePath, modality ?? undefined)
                console.log("[fileWatcher] reindexed changed file:", filePath)
            } catch (error) {
                this.status = "error";
                console.error("[fileWatcher] change failed:", filePath, error)
            }
        })

        this.watcher.on("unlink", async (filePath) => {
            if (!shouldIndexFile(filePath, rules)) return
            try {
                await this.vectorStore.deleteDocument(filePath)
                console.log("[fileWatcher] removed deleted file:", filePath)
            } catch (error) {
                this.status = "error";
                console.error("[fileWatcher] unlink failed:", filePath, error)
            }
        })

        this.watcher.on("error", (error) => {
            this.status = "error"
            console.error("[fileWatcher] watcher error:", error)
        })

        this.status = "running"
    }

    async clearIndex() {
        await this.vectorStore.clearIndex()
        return this.getStatus()
    }

    async reindex() {
        if (!this.rootPath) {
            return { ...this.getStatus(), warning: "no_root_path" as const }
        }
        await this.vectorStore.clearIndex()
        await this.start(this.rootPath, this.indexingOptions)
        return this.getStatus()
    }

    async stop() {
        if (this.watcher) {
            await this.watcher.close()
            this.watcher = null
        }

        this.rootPath = null
        this.indexingRules = null
        this.status = "stopped"
    }

    getStatus() {
        return {
            status: this.status,
            rootPath: this.rootPath,
            indexingOptions: this.indexingOptions,
            indexingStats: this.vectorStore.getStats(),
        }
    }
}

function shouldIndexFile(filePath: string, rules: IndexingRules | null) {
    if (!rules) return false;
    if (rules.shouldSkipFile(filePath)) return false;
    const modality = rules.getFileModality(filePath);
    return modality === "text" || modality === "image" || modality === "code";
}