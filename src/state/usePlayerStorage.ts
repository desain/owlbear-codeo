import OBR from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { CodeoScript } from "../CodeoScript";
import { LOCAL_STORAGE_STORE_NAME } from "../constants";
import { Execution } from "../Execution";

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

async function fetchDefaults(): Promise<CodeoScript[]> {
    await ObrSceneReady;
    return [];
}

export interface PlayerStorage {
    hasSensibleValues: boolean;
    scripts: CodeoScript[];
    executions: Map<string, Execution[]>;
    sceneReady: boolean;
    playerColor: string;
    _markSensible(this: void): void;
    addScript(
        this: void,
        script: Omit<CodeoScript, "id" | "createdAt" | "updatedAt">,
    ): void;
    removeScript(this: void, id: string): void;
    updateScript(
        this: void,
        id: string,
        updates: Partial<Omit<CodeoScript, "id" | "createdAt" | "updatedAt">>,
    ): void;
    addExecution(this: void, scriptId: string, execution: Execution): void;
    stopExecution(this: void, scriptId: string, executionId: string): void;
    setSceneReady(this: void, sceneReady: boolean): void;
    setPlayerColor(this: void, playerColor: string): void;
}

export const usePlayerStorage = create<PlayerStorage>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                hasSensibleValues: false,
                scripts: [],
                executions: new Map(),
                sceneReady: false,
                playerColor: "#FFFFFF",
                _markSensible() {
                    set({ hasSensibleValues: true });
                },
                addScript(scriptData) {
                    const now = Date.now();
                    const newScript: CodeoScript = {
                        ...scriptData,
                        id: crypto.randomUUID(),
                        createdAt: now,
                        updatedAt: now,
                    };
                    set((state) => ({
                        scripts: [...state.scripts, newScript],
                    }));
                },
                removeScript: (id) =>
                    set((state) => {
                        for (const execution of state.executions.get(id) ??
                            []) {
                            execution.stop();
                        }
                        const executions = new Map(state.executions);
                        executions.delete(id);
                        return {
                            scripts: state.scripts.filter(
                                (script) => script.id !== id,
                            ),
                            executions,
                        };
                    }),
                updateScript: (id, updates) =>
                    set((state) => ({
                        scripts: state.scripts.map((script) =>
                            script.id === id
                                ? {
                                      ...script,
                                      ...updates,
                                      updatedAt: Date.now(),
                                  }
                                : script,
                        ),
                    })),
                addExecution: (scriptId, execution) =>
                    set((state) => ({
                        executions: new Map(state.executions).set(scriptId, [
                            ...(state.executions.get(scriptId) ?? []),
                            execution,
                        ]),
                    })),
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
                        return {
                            executions: new Map(state.executions).set(
                                scriptId,
                                executionsForScript.filter(
                                    (execution) =>
                                        execution.executionId !== executionId,
                                ),
                            ),
                        };
                    }),
                setSceneReady: (sceneReady: boolean) => set({ sceneReady }),
                setPlayerColor: (playerColor) => set({ playerColor }),
            }),
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
