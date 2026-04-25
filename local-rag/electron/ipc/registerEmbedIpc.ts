import { ipcMain } from "electron";
import { embedder } from "../services.js";

/* - EmbedSidecar IPC handler -----------------------
*/
export function registerEmbedIpc() {
    ipcMain.handle("embedder:start", async () => {
        await embedder.start();
        return embedder.getStatus();
    });

    ipcMain.handle("embedder:stop", async () => {
        embedder.stop();
        return embedder.getStatus();
    });

    ipcMain.handle("embedder:status", async () => {
        return embedder.getStatus();
    });
}