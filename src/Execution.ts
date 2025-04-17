import { isObject } from "owlbear-utils";

export type NewExecution = Readonly<{
    stop: VoidFunction;
    executionName: string;
}>;

export function isNewExecution(execution: unknown): execution is NewExecution {
    return (
        isObject(execution) &&
        "stop" in execution &&
        typeof execution.stop === "function" &&
        "executionName" in execution &&
        typeof execution.executionName === "string"
    );
}

export type Execution = NewExecution &
    Readonly<{
        executionId: string;
    }>;
