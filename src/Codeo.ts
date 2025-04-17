import { NewExecution } from "./Execution";
import { usePlayerStorage } from "./state/usePlayerStorage";

export class Codeo {
    private executionId: string | null = null;

    constructor(private readonly scriptId: string) {}

    /**
     * If the script has an active execution, calls the execution's stop() function and removes
     * the execution.
     */
    stopSelf = () => {
        if (this.executionId === null) {
            throw new Error("stopSelf() called before execution created");
        } else {
            usePlayerStorage
                .getState()
                .stopExecution(this.scriptId, this.executionId);
        }
    };

    saveExecution = (executionId: string) => {
        if (this.executionId !== null) {
            throw new Error("Execution already set");
        }
        this.executionId = executionId;
    };

    continueExecution = (name: string, stop: VoidFunction): NewExecution => ({
        stop,
        executionName: name,
    });
}
