import { broadcast } from "./broadcast/handleBroadcast";
import type { NewExecution } from "./Execution";

export class Codeo {
    #executionId: string | null = null;
    readonly #scriptId: string;

    constructor(scriptId: string) {
        this.#scriptId = scriptId;
    }

    /**
     * If the script has an active execution, calls the execution's stop() function and removes
     * the execution.
     */
    stopSelf = () => {
        if (this.#executionId === null) {
            throw new Error("stopSelf() called before execution created");
        } else {
            void broadcast({
                type: "STOP_EXECUTION",
                id: this.#scriptId,
                executionId: this.#executionId,
            });
        }
    };

    saveExecution = (executionId: string) => {
        if (this.#executionId !== null) {
            throw new Error("Execution already set");
        }
        this.#executionId = executionId;
    };

    continueExecution = (name: string, stop: VoidFunction): NewExecution => ({
        stop,
        executionName: name,
    });
}
