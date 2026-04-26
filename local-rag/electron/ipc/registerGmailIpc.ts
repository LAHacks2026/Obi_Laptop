import { ipcMain } from "electron";
import { gmailIndexer } from "../services.js";

export function registerGmailIpc() {
    ipcMain.handle("gmail:status", async () => {
        return gmailIndexer.getStatus();
    });

    ipcMain.handle("gmail:syncMetadata", async (_event, limit = 200) => {
        return gmailIndexer.syncMetadata(limit);
    });

    ipcMain.handle("gmail:clearIndex", async () => {
        return gmailIndexer.clearIndex();
    });
}
