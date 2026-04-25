import { validToolCalls } from "./tools"; // validToolCall: Set<String>
import { vectorStore } from "../services";

export async function executeToolCalls(mergedToolCalls: any[]) {

    console.log("FROM executeToolCalls");
    console.log(mergedToolCalls);

    for (const call of mergedToolCalls) {
        const functionName = call.function.name;
        const functionArguments = JSON.parse(call.function.arguments);

        if (!validToolCalls.has(functionName)) {
            return;
        }

        switch (functionName) {
            case "get_weather":

                break;
            case "search_files":
                const searchQuery = functionArguments.query;
                const searchRes = await vectorStore.search(searchQuery, 5);
                break;
            default:
                console.log("No tool found");
        }
    }
}