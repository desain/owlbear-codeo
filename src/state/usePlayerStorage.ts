import OBR from "@owlbear-rodeo/sdk";
import { enableMapSet } from "immer";
import { getOrInsert } from "owlbear-utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { CodeoScript } from "../CodeoScript";
import { LOCAL_STORAGE_STORE_NAME } from "../constants";
import { Execution } from "../Execution";

enableMapSet();

const ObrSceneReady = new Promise<void>((resolve) => {
    OBR.onReady(async () => {
        if (await OBR.scene.isReady()) {
            resolve();
        } else {
            const unsubscribeScene = OBR.scene.onReadyChange((ready) => {
                if (ready) {
                    unsubscribeScene();
                    resolve();
                }
            });
        }
    });
});

async function fetchDefaults(): Promise<StoredScript[]> {
    await ObrSceneReady;
    return [];
}

interface BooleanParameter {
    type: "boolean";
    value?: boolean;
}
interface NumberParameter {
    type: "number";
    value?: number;
}
interface StringParameter {
    type: "string";
    value?: string;
}

export type ParameterWithValue =
    | BooleanParameter
    | NumberParameter
    | StringParameter;

export type StoredScript = CodeoScript & {
    id: string;
    createdAt: number;
    updatedAt: number;
    parameters: ParameterWithValue[];
};

export interface PlayerStorage {
    hasSensibleValues: boolean;
    scripts: StoredScript[];
    executions: Map<string, Execution[]>;
    sceneReady: boolean;
    playerColor: string;
    _markSensible(this: void): void;
    addScript(this: void, script: CodeoScript): void;
    removeScript(this: void, id: string): void;
    updateScript(this: void, id: string, updates: Partial<CodeoScript>): void;
    addExecution(this: void, scriptId: string, execution: Execution): void;
    stopExecution(this: void, scriptId: string, executionId: string): void;
    setSceneReady(this: void, sceneReady: boolean): void;
    setPlayerColor(this: void, playerColor: string): void;
    setParameterValue(
        this: void,
        scriptId: string,
        paramIndex: number,
        value: NonNullable<ParameterWithValue["value"]>,
    ): void;
}

export const usePlayerStorage = create<PlayerStorage>()(
    subscribeWithSelector(
        persist(
            immer((set) => ({
                hasSensibleValues: false,
                scripts: [],
                executions: new Map(),
                sceneReady: false,
                playerColor: "#FFFFFF",
                _markSensible: () => set({ hasSensibleValues: true }),
                addScript: (scriptData) =>
                    set((state) => {
                        const now = Date.now();
                        state.scripts.push({
                            ...scriptData,
                            id: crypto.randomUUID(),
                            createdAt: now,
                            updatedAt: now,
                        });
                    }),
                removeScript: (id) =>
                    set((state) => {
                        const scriptExecutions = state.executions.get(id) ?? [];
                        for (const execution of scriptExecutions) {
                            execution.stop();
                        }
                        state.executions.delete(id);
                        state.scripts = state.scripts.filter(
                            (script) => script.id !== id,
                        );
                    }),
                updateScript: (id, updates) =>
                    set((state) => {
                        state.scripts = state.scripts.map((script) =>
                            script.id === id
                                ? {
                                      ...script,
                                      ...updates,
                                      id,
                                      createdAt: script.createdAt,
                                      updatedAt: Date.now(),
                                  }
                                : script,
                        );
                    }),
                addExecution: (scriptId, execution) =>
                    set((state) => {
                        getOrInsert(state.executions, scriptId, () => []).push(
                            execution,
                        );
                    }),
                stopExecution: (scriptId, executionId) =>
                    set((state) => {
                        const executionsForScript =
                            state.executions.get(scriptId) ?? [];
                        const execution = executionsForScript.find(
                            (execution) =>
                                execution.executionId === executionId,
                        );
                        if (execution) {
                            execution.stop();
                        }
                        state.executions.set(
                            scriptId,
                            executionsForScript.filter(
                                (execution) =>
                                    execution.executionId !== executionId,
                            ),
                        );
                    }),
                setSceneReady: (sceneReady: boolean) => set({ sceneReady }),
                setPlayerColor: (playerColor) => set({ playerColor }),
                setParameterValue(scriptId, paramIndex, value) {
                    set((state) => {
                        const scriptIdx = state.scripts.findIndex(
                            (script) => script.id === scriptId,
                        );
                        if (scriptIdx === -1) {
                            console.warn(
                                `Script with ID ${scriptId} not found`,
                            );
                            return;
                        }
                        if (
                            paramIndex < 0 ||
                            paramIndex >=
                                state.scripts[scriptIdx].parameters.length
                        ) {
                            console.warn(
                                `Parameter index ${paramIndex} out of bounds for script with ID ${scriptId}`,
                            );
                            return;
                        }
                        const parameter =
                            state.scripts[scriptIdx].parameters[paramIndex];
                        if (typeof value !== parameter.type) {
                            console.warn(
                                `Value type ${typeof value} does not match parameter type ${
                                    parameter.type
                                }`,
                            );
                            return;
                        }
                        parameter.value = value;
                    });
                },
            })),
            {
                name: LOCAL_STORAGE_STORE_NAME,
                partialize: ({ scripts, hasSensibleValues }) => ({
                    scripts,
                    hasSensibleValues,
                }),
                onRehydrateStorage() {
                    return (state, error) => {
                        if (state) {
                            if (!state.hasSensibleValues) {
                                void fetchDefaults().then((defaultScripts) => {
                                    state.scripts = defaultScripts;
                                    state._markSensible();
                                });
                            }
                        } else if (error) {
                            console.error(
                                "Error hydrating player settings store",
                                error,
                            );
                        }
                    };
                },
            },
        ),
    ),
);
