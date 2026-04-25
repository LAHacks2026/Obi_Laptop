import { BrowserWindow, app } from "electron";
import { fileURLToPath } from "node:url"
import path from "node:path";

// -- Developer Mode Check -----------------------------
const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
        x: 0,
        y: 0,
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true, // preload runs in isolated context
            nodeIntegration: false, // renderer can't import Node APIs directly
        },
    })

    if (isDev) {
        const devUrl = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
        win.loadURL(devUrl);
        // win.webContents.openDevTools() // Auto opens dev tools
    } else {
        win.loadFile(path.join(__dirname, "../dist/index.html"))
    }
}