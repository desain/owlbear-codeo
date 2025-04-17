import { NewExecution } from "./Execution";
import { usePlayerStorage } from "./state/usePlayerStorage";

const CODEO_EXECUTION_ID = Symbol("CodeoExecutionId");

export interface Codeo {
    [CODEO_EXECUTION_ID]: string | null;
    /**
     * If the script has an active execution, calls the execution's stop() function and removes
     * the execution.
     */
    stopSelf(): void;
    continueExecution(name: string, stop: VoidFunction): NewExecution;
}

export function makeCodeo(scriptId: string): Codeo {
    const codeo: Codeo = {
        [CODEO_EXECUTION_ID]: null,
        stopSelf() {
            const executionId = codeo[CODEO_EXECUTION_ID];
            if (executionId === null) {
                throw new Error("stopSelf() called before execution created");
            } else {
                usePlayerStorage
                    .getState()
                    .stopExecution(scriptId, executionId);
            }
        },
        continueExecution(name, stop) {
            return {
                stop,
                executionName: name,
            };
        },
    };
    return codeo;
}

export function saveExecution(codeo: Codeo, executionId: string) {
    if (codeo[CODEO_EXECUTION_ID] !== null) {
        throw new Error("Execution already set");
    }
    codeo[CODEO_EXECUTION_ID] = executionId;
}
