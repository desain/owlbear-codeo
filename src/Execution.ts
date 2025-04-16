import { isObject } from "owlbear-utils";

export interface NewExecution {
    stop: VoidFunction;
    executionName: string;
}
export function isNewExecution(execution: unknown): execution is NewExecution {
    return (
        isObject(execution) &&
        "stop" in execution &&
        typeof execution.stop === "function" &&
        "executionName" in execution &&
        typeof execution.executionName === "string"
    );
}

export interface Execution extends NewExecution {
    executionId: string;
}
