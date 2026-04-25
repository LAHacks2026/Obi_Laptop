import { app, BrowserWindow } from "electron"
import { initDatabase } from "./database.js";
import { registerLlamaIpc } from "./ipc/registerLlamaIpc.js"
import { registerLlamaStreamIpc } from "./ipc/registerLlamaStreamIpc.js";
import { registerVectorStoreIpc } from "./ipc/registerVectorStoreIpc.js";
import { registerEmbedIpc } from "./ipc/registerEmbedIpc.js";
import { registerFileWatcherIpc } from "./ipc/registerFileWatcherIpc.js";
import { fileWatcher, llama, embedder } from "./services.js";
import { createWindow } from "./app/createWindow.js";

/* -- Module paths in ESM -------------------------------
Because package.json has "type": "module", .js files are treated as ESM (ECMAScript Modules).
ESM uses `import` / `export` and does not provide CommonJS globals like `__filename` and `__dirname`.

To get the current file and directory (CommonJS-style), we derive them from `import.meta.url`.
This is useful for building paths relative to this module (e.g., preload.ts).
*/

app.whenReady().then(async () => {
    try {
        initDatabase();     // Starts on App startup
        registerLlamaIpc(); // Called from frontend useEffect
        registerLlamaStreamIpc();
        registerEmbedIpc(); // Called from frontend useEffect
        registerVectorStoreIpc();   // Called from frontend search()
        registerFileWatcherIpc();

        createWindow();
    } catch (error) {
        console.error("Startup Error (electron main):", error);
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// App shutdown logic
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

app.on("before-quit", () => {
    fileWatcher.stop();
    llama.stop();
    embedder.stop();
});