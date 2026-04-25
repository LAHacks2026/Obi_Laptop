export const weatherTools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather for a given city or location.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City name or location, for example: San Francisco, CA"
          }
        },
        required: ["location"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_files",
      description: "Search the file system for relevant files to provide additional context.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The query that will be embedded for a search."
          }
        },
        required: ["query"],
        additionalProperties: false
      }
    }
  }
];

export const validToolCalls = new Set<String>;
for (const tool of weatherTools) {
  validToolCalls.add(tool.function.name);
}