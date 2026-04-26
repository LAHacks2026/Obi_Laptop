import { BrowserWindow, dialog, ipcMain } from "electron"
import { fileWatcher } from "../services.js";
import { IndexingOptions } from "../indexingRules.js";

/* - FileWatcher IPC handler -----------------------
*/
export function registerFileWatcherIpc() {
    ipcMain.handle("watcher:start", async (_event, rootPath: string, options?: IndexingOptions) => {
        await fileWatcher.start(rootPath, options)
        return fileWatcher.getStatus()
    })

    ipcMain.handle("watcher:stop", async () => {
        await fileWatcher.stop()
        return fileWatcher.getStatus()
    })

    ipcMain.handle("watcher:status", async () => {
        return fileWatcher.getStatus()
    })

    ipcMain.handle("watcher:pickDirectory", async (event, options?: IndexingOptions) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        const result = await dialog.showOpenDialog(win!, {
            properties: ["openDirectory"],
            title: "Choose a folder to watch",
        })

        if (result.canceled || result.filePaths.length === 0) {
            return { canceled: true, path: null, ...fileWatcher.getStatus() }
        }

        const selectedPath = result.filePaths[0]
        await fileWatcher.setPath(selectedPath, options)
        return { canceled: false, path: selectedPath, ...fileWatcher.getStatus() }
    })

    ipcMain.handle("watcher:clearIndex", async () => {
        return fileWatcher.clearIndex()
    })

    ipcMain.handle("watcher:reindex", async () => {
        return fileWatcher.reindex()
    })
}