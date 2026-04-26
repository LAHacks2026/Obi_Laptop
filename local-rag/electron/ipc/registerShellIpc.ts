import { ipcMain, shell } from "electron"
import fs from "node:fs"
import path from "node:path"
import { getDb } from "../database.js"

const MAX_PATH_LEN = 4096

function isIndexedDocumentPath(p: string): boolean {
    const db = getDb()
    const textOrCode = db
        .prepare("SELECT 1 AS ok FROM documents WHERE path = ? LIMIT 1")
        .get(p) as { ok: number } | undefined
    if (textOrCode) return true

    const image = db
        .prepare("SELECT 1 AS ok FROM image_documents WHERE path = ? LIMIT 1")
        .get(p) as { ok: number } | undefined
    return Boolean(image)
}

function toRealPath(p: string): string {
    try {
        const fn = fs.realpathSync.native as ((path: string) => string) | undefined
        return typeof fn === "function" ? fn(p) : fs.realpathSync(p)
    } catch {
        throw new Error("realpath_failed")
    }
}

export function registerShellIpc() {
    ipcMain.handle(
        "shell:openIndexedPath",
        async (_event, rawPath: unknown): Promise<{ ok: true } | { ok: false; error: string }> => {
            if (typeof rawPath !== "string") {
                return { ok: false, error: "invalid_path" }
            }

            const trimmed = rawPath.trim()
            if (!trimmed || trimmed.length > MAX_PATH_LEN || trimmed.includes("\0")) {
                return { ok: false, error: "invalid_path" }
            }

            let resolved: string
            try {
                resolved = path.resolve(trimmed)
            } catch {
                return { ok: false, error: "invalid_path" }
            }

            let stat: fs.Stats
            try {
                stat = fs.statSync(resolved)
            } catch {
                return { ok: false, error: "not_found" }
            }

            if (!stat.isFile()) {
                return { ok: false, error: "not_a_file" }
            }

            let openTarget = resolved
            if (!isIndexedDocumentPath(resolved)) {
                let real: string
                try {
                    real = toRealPath(resolved)
                } catch {
                    return { ok: false, error: "not_indexed" }
                }
                if (!isIndexedDocumentPath(real)) {
                    return { ok: false, error: "not_indexed" }
                }
                openTarget = real
            }

            const shellErr = await shell.openPath(openTarget)
            if (shellErr) {
                return { ok: false, error: shellErr }
            }

            return { ok: true }
        }
    )
}
