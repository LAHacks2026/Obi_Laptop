import { ipcMain } from "electron";
import { vectorStore } from "../services.js";

/* - VectorStore(RAG) IPC handler -----------------------
*/
export function registerVectorStoreIpc() {
    // ipcMain.handle("rag:indexDirectory", async (_event, rootPath: string) => {
    //     return vectorStore.indexDirectory(rootPath)
    // })

    // ipcMain.handle("rag:indexFile", async (_event, filePath: string) => {
    //     return vectorStore.indexFile(filePath)
    // })

    ipcMain.handle("rag:search", async (_event, query: string, limit = 5) => {
        return vectorStore.search(query, limit)
    })
}