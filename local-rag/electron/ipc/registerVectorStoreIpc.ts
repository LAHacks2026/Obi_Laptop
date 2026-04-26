import { ipcMain } from "electron";
import { imageCaptioner, vectorStore } from "../services.js";

/* - VectorStore(RAG) IPC handler -----------------------
*/
export function registerVectorStoreIpc() {
    ipcMain.handle("rag:indexDirectory", async (_event, rootPath: string) => {
        return vectorStore.indexDirectory(rootPath)
    })

    ipcMain.handle("rag:indexFile", async (_event, filePath: string) => {
        return vectorStore.indexFile(filePath)
    })

    ipcMain.handle("rag:search", async (_event, query: string, limit = 5) => {
        return vectorStore.search(query, limit)
    })

    ipcMain.handle("rag:describeImage", async (_event, imagePath: string) => {
        return imageCaptioner.describeImage(imagePath)
    })

    ipcMain.handle("rag:answerImageQuestion", async (_event, imagePath: string, question: string) => {
        return imageCaptioner.answerQuestion(imagePath, question)
    })

    ipcMain.handle("rag:extractImageText", async (_event, imagePath: string) => {
        return imageCaptioner.extractText(imagePath)
    })

    ipcMain.handle("rag:detectImageObjects", async (_event, imagePath: string) => {
        return imageCaptioner.detectObjects(imagePath)
    })

    ipcMain.handle("rag:stats", async () => {
        return vectorStore.getStats()
    })
}