type ToolCallDelta = {
    index: number;
    id?: string;
    type?: string;
    function?: {
        name?: string;
        arguments?: string;
    };
};

type AccumulatedToolCall = {
    index: number;
    id: string;
    type: string;
    function: {
        name: string;
        arguments: string;
    };
};

export class ToolCallAccumulator {
    private calls = new Map<number, AccumulatedToolCall>(); // {index: AccumulatedToolCall}

    addDeltas(deltas: ToolCallDelta[]) {
        for (const delta of deltas) {
            const index = delta.index;

            const existing = this.calls.get(index) ?? {
                index,
                id: "",
                type: "function",
                function: {
                    name: "",
                    arguments: "",
                },
            };

            if (delta.id) existing.id = delta.id;
            if (delta.type) existing.type = delta.type;

            if (delta.function?.name) {
                existing.function.name = delta.function.name;
            }

            if (typeof delta.function?.arguments === "string") {
                existing.function.arguments += delta.function.arguments;
            }

            this.calls.set(index, existing);
        }
    }

    getAll(): AccumulatedToolCall[] {
        return Array.from(this.calls.values()).sort((a, b) => a.index - b.index);
    }

    getByIndex(index: number): AccumulatedToolCall | undefined {
        return this.calls.get(index);
    }

    clear() {
        this.calls.clear();
    }
}