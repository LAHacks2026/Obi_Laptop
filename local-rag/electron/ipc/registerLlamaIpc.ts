import { ipcMain } from "electron";
import { llama } from "../services.js";

/* - LlamaSidecar IPC handler -----------------------------------
    Main-process handlers manage the LlamaSidecar lifecycle (ipcMain.handle).
    preload.ts exposes a safe renderer API (via contextBridge) that calls those
    handlers using ipcRenderer.invoke, limiting what the frontend can access.

    llama:start
    llama:status
    llama:stop
*/
export function registerLlamaIpc() {
    ipcMain.handle("llama:start", async () => {
        await llama.start();
        return llama.getStatus();
    });

    ipcMain.handle("llama:stop", async () => {
        llama.stop();
        return llama.getStatus();
    });

    ipcMain.handle("llama:status", async () => {
        return llama.getStatus();
    });
}