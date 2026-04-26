import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import net from "node:net";
import { SidecarStatus } from "./electron";

export class LlamaSidecar {
    private proc: ChildProcessWithoutNullStreams | null = null;
    private status: SidecarStatus = "stopped";
    private port: number = 0;
    private baseUrl: string = "";
    private modelType: string = "";
    /** Coalesces concurrent `start()` (e.g. React Strict Mode double-invoke). */
    private startPromise: Promise<void> | null = null;

    getStatus() {
        return { status: this.status, port: this.port, baseUrl: this.baseUrl, modelType: this.modelType };
    }

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

    private chatModelPath() {
        const base = this.resourcesBase();
        return path.join(base, "models", "gemma-4-E2B-it-Q4_K_M.gguf");
    }

    private async getFreePort(): Promise<number> {
        return await new Promise((resolve, reject) => {
            const srv = net.createServer();
            srv.listen(0, "127.0.0.1", () => {
                const addr = srv.address();
                srv.close(() => {
                    if (typeof addr === "object" && addr?.port) resolve(addr.port);
                    else reject(new Error("Failed to acquire free port for chat model"));
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
        const pollUrl = `${baseUrl}/v1/models`;
        console.log(`[llama] polling readiness at ${pollUrl}`);
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (abortSignal.aborted) {
                throw abortSignal.reason ?? new Error("llama-server process exited before becoming ready");
            }
            try {
                const res = await fetch(pollUrl);
                if (res.ok) return;
            } catch {
                // not ready yet
            }
            await new Promise((r) => setTimeout(r, 500));
        }
        throw new Error(`llama-server did not become ready within ${timeoutMs / 1000}s — check that the model file exists and the binary works`);
    }

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
        this.baseUrl = `http://127.0.0.1:${this.port}`;

        const bin = this.binPath();
        const model = this.chatModelPath();

        // Pre-flight: verify binary and model exist before trying to spawn
        if (!fs.existsSync(bin)) {
            this.status = "error";
            throw new Error(`llama-server binary not found at: ${bin}`);
        }
        if (!fs.existsSync(model)) {
            this.status = "error";
            throw new Error(
                `Chat model not found at: ${model}\n` +
                `Place "Qwen3.5-2B-Q4_K_M.gguf" in the resources/models/ directory.`
            );
        }

        this.modelType = model;

        const args = [
            "--host", "127.0.0.1",
            "--port", String(this.port),
            "-m", model,
            "--ctx-size", "8192",
            "--threads", "4",
            "--cache-type-k", "q8_0",
            "--cache-type-v", "q8_0",
        ];

        console.log(`[llama] spawning: ${bin} ${args.join(" ")}`);

        this.proc = spawn(bin, args, {
            cwd: path.dirname(bin),
            env: {
                ...process.env,
                DYLD_LIBRARY_PATH: path.join(this.resourcesBase(), "bin"),
            },
            stdio: "pipe",
        });

        // Shared abort signal so waitUntilReady can stop immediately on exit
        const abort: { aborted: boolean; reason?: Error } = { aborted: false };
        let stderrBuffer = "";

        this.proc.stdout.on("data", (d: Buffer) => {
            console.log("[llama:stdout]", d.toString().trimEnd());
        });

        this.proc.stderr.on("data", (d: Buffer) => {
            const text = d.toString();
            stderrBuffer += text;
        });

        this.proc.on("error", (err) => {
            console.error("[llama] failed to spawn process:", err.message);
            abort.aborted = true;
            abort.reason = new Error(`llama-server spawn error: ${err.message}`);
            this.status = "error";
            this.proc = null;
        });

        this.proc.on("exit", (code, signal) => {
            console.error(`[llama] process exited — code=${code} signal=${signal}`);

            if (!abort.aborted) {
                abort.aborted = true;
                abort.reason = new Error(
                    `llama-server exited early (code=${code}, signal=${signal})` +
                    (stderrBuffer ? `\nLast output: ${stderrBuffer.slice(-500)}` : "")
                );
            }
            this.proc = null;
            this.status = "stopped";
        });

        try {
            await this.waitUntilReady(this.baseUrl, abort);
            this.status = "running";
            console.log("[llama] chat-server is running at", this.baseUrl);
        } catch (e) {
            this.status = "error";
            this.stop();
            throw e;
        }
    }

    stop() {
        if (!this.proc) return;
        this.proc.kill();
        this.proc = null;
        this.status = "stopped";
    }
}
