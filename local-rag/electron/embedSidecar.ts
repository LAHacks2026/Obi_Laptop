import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import { SidecarStatus } from "./electron";
import { app } from "electron";
import path from "node:path";
import net from "node:net";

type EmbeddingResponse = {
    data: Array<{
        embedding: number[]
        index?: number
    }>
}

export class EmbedSidecar {
    private proc: ChildProcessWithoutNullStreams | null = null;
    private status: SidecarStatus = "stopped";
    private port: number = 0;
    private baseUrl: string = "";
    private hostUrl: string = "127.0.0.1";
    /** Coalesces concurrent `start()` (e.g. React Strict Mode double-invoke). */
    private startPromise: Promise<void> | null = null;

    // Helpers
    private resourcesBase() {
        return app.isPackaged
            ? process.resourcesPath
            : path.resolve(app.getAppPath(), "resources");
    }

    private binPath() {
        const base = this.resourcesBase();
        const exe = process.platform === "win32" ? "llama-server.exe" : "llama-server";
        return path.join(base, "bin", exe);
    }

    private embedModelPath() {
        const base = this.resourcesBase();
        return path.join(base, "models", "nomic-embed-text-v2-moe.Q4_K_M.gguf");
    }

    private async getFreePort(): Promise<number> {
        return await new Promise((resolve, reject) => {
            const srv = net.createServer();
            srv.listen(0, "127.0.0.1", () => {
                const addr = srv.address();
                srv.close(() => {
                    if (typeof addr === "object" && addr?.port) resolve(addr.port);
                    else reject(new Error("Failed to acquire free port for embed model"));
                });
            });
            srv.on("error", reject);
        });
    }

    private async waitUntilReady(
        baseUrl: string,
        abortSignal: { aborted: boolean; reason?: Error },
        timeoutMs = 60_000
    ) {
        const pollUrl = `${baseUrl}/health`;
        console.log(`[embed] polling readiness at ${pollUrl}`);
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (abortSignal.aborted) {
                throw abortSignal.reason ?? new Error("embed-server process exited before becoming ready");
            }
            try {
                const res = await fetch(pollUrl);
                if (res.ok) return;
            } catch {
                // not ready yet
            }
            await new Promise((r) => setTimeout(r, 500));
        }
        throw new Error(`Nomic embedding sidecar did not become ready within ${timeoutMs / 1000}s — check that the model file exists`);
    }

    // Lifecycle
    async start() {
        if (this.status === "running" && this.proc) return;
        if (!this.startPromise) {
            this.startPromise = this.runStart().finally(() => {
                this.startPromise = null;
            });
        }
        await this.startPromise;
    }

    private async runStart() {
        if (this.proc || this.status === "starting" || this.status === "running") return;

        this.status = "starting";
        this.port = await this.getFreePort();
        this.baseUrl = `http://${this.hostUrl}:${this.port}`;

        const bin = this.binPath();
        const model = this.embedModelPath();

        // Pre-flight: verify binary and model exist before trying to spawn
        if (!fs.existsSync(bin)) {
            this.status = "error";
            throw new Error(`llama-server binary not found at: ${bin}`);
        }
        if (!fs.existsSync(model)) {
            this.status = "error";
            throw new Error(
                `Embedding model not found at: ${model}\n` +
                `Place "nomic-embed-text-v2-moe.Q4_K_M.gguf" in the resources/models/ directory.`
            );
        }

        const args = [
            "--host", this.hostUrl,
            "--port", String(this.port),
            "-m", model,
            "--embeddings",
            "--pooling", "mean",
            "--ctx-size", "8192",
            "--batch-size", "512",
        ];

        console.log(`[embed] spawning: ${bin} ${args.join(" ")}`);

        this.proc = spawn(bin, args, {
            cwd: path.dirname(bin),
            env: {
                ...process.env,
                ...(process.platform === "darwin"
                    ? { DYLD_LIBRARY_PATH: path.join(this.resourcesBase(), "bin") }
                    : process.platform === "linux"
                        ? { LD_LIBRARY_PATH: path.join(this.resourcesBase(), "bin") }
                        : {}),
            },
            stdio: "pipe",
        });

        // Shared abort signal so waitUntilReady can stop immediately on exit
        const abort: { aborted: boolean; reason?: Error } = { aborted: false };
        let stderrBuffer = "";

        this.proc.stdout.on("data", (d: Buffer) => {
            console.log("[embed:stdout]", d.toString().trimEnd());
        });

        this.proc.stderr.on("data", (d: Buffer) => {
            const text = d.toString();
            stderrBuffer += text;
            console.error("[embed:stderr]", text.trimEnd());
        });

        this.proc.on("error", (err) => {
            console.error("[embed] failed to spawn process:", err.message);
            abort.aborted = true;
            abort.reason = new Error(`embed-server spawn error: ${err.message}`);
            this.proc = null;
            this.status = "error";
        });

        this.proc.on("exit", (code, signal) => {
            console.error(`[embed] process exited — code=${code} signal=${signal}`);
            if (stderrBuffer) {
                console.error("[embed] last stderr output:\n", stderrBuffer.slice(-2000));
            }
            if (!abort.aborted) {
                abort.aborted = true;
                abort.reason = new Error(
                    `embed-server exited early (code=${code}, signal=${signal})` +
                    (stderrBuffer ? `\nLast output: ${stderrBuffer.slice(-500)}` : "")
                );
            }
            this.proc = null;
            this.status = (this.status === "starting" || this.status === "running") ? "error" : "stopped";
        });

        try {
            await this.waitUntilReady(this.baseUrl, abort);
            this.status = "running";
            console.log("[embed] embed-server is running at", this.baseUrl);
        } catch (e) {
            this.status = "error";
            this.stop();
            throw e;
        }
    }

    stop() {
        if (this.proc) {
            this.proc.kill();
            this.proc = null;
        }
        this.status = "stopped";
    }

    getStatus() {
        return { status: this.status, port: this.port, baseUrl: this.baseUrl };
    }

    // Embedding calls
    async embed(input: string | string[]) {
        if (this.status !== "running") await this.start();

        const res = await fetch(`${this.baseUrl}/v1/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input }),
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`Embeddings HTTP ${res.status}: ${txt}`);
        }

        return (await res.json()) as EmbeddingResponse;
    }

    async embedOne(text: string): Promise<number[]> {
        const json = await this.embed(text);
        const vector = json.data?.[0]?.embedding;

        if (!vector || !Array.isArray(vector)) {
            throw new Error("Embedding response missing data[0].embedding");
        }

        return vector;
    }

    async embedMany(texts: string[]): Promise<number[][]> {
        const json = await this.embed(texts);
        const vectors = json.data?.map((item) => item.embedding);

        if (!vectors || vectors.length !== texts.length) {
            throw new Error("Embedding response length mismatch");
        }

        return vectors;
    }
}
