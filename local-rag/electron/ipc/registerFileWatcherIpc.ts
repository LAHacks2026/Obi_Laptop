import { BrowserWindow, dialog, ipcMain } from "electron"
import { fileWatcher } from "../services.js";

/* - FileWatcher IPC handler -----------------------
*/
export function registerFileWatcherIpc() {
    ipcMain.handle("watcher:start", async (_event, rootPath: string) => {
        await fileWatcher.start(rootPath)
        return fileWatcher.getStatus()
    })

    ipcMain.handle("watcher:stop", async () => {
        await fileWatcher.stop()
        return fileWatcher.getStatus()
    })

    ipcMain.handle("watcher:status", async () => {
        return fileWatcher.getStatus()
    })

    ipcMain.handle("watcher:pickDirectory", async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        const result = await dialog.showOpenDialog(win!, {
            properties: ["openDirectory"],
            title: "Choose a folder to watch",
        })

        if (result.canceled || result.filePaths.length === 0) {
            return { canceled: true, path: null }
        }

        const selectedPath = result.filePaths[0]
        await fileWatcher.setPath(selectedPath)
        return { canceled: false, path: selectedPath }
    })
}