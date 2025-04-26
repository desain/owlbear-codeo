import { Item } from "@owlbear-rodeo/sdk";
import { enableMapSet } from "immer";
import { getOrInsert } from "owlbear-utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { clearExecution, setShortcutEnabledUi } from "../action/shortcutTool";
import { CodeoScript } from "../CodeoScript";
import { LOCAL_STORAGE_STORE_NAME, Shortcut } from "../constants";
import { Execution } from "../Execution";

enableMapSet();

const SET_SENSIBLE = Symbol("SetSensible");

/*
Values here must be readonly to avoid a Typescript issue
If values can be written, then this compiles:

const x: ParameterWithValue =
    Math.random() > 0.5
        ? { type: "string", value: "x" }
        : { type: "number", value: 0 };

x.value = 100;

But it might result in a runtime state where x = {
    type: "string",
    value: 100,
}

This is apparently not considered a typescript bug, but
I think it should be.

Making the values readonly avoids this.
*/

type BooleanParameter = Readonly<{
    type: "boolean";
    value?: boolean;
}>;
type NumberParameter = Readonly<{
    type: "number";
    value?: number;
}>;
type StringParameter = Readonly<{
    type: "string";
    value?: string;
}>;

type ItemParameter = Readonly<{
    type: "Item";
    value?: Item;
}>;

export type ParameterWithValue =
    | BooleanParameter
    | NumberParameter
    | StringParameter
    | ItemParameter;

function withValue<T extends ParameterWithValue>(
    parameter: T,
    value: T["value"],
): T {
    if (value === undefined) {
        return { ...parameter, value };
    }

    switch (parameter.type) {
        case "boolean":
            return { ...parameter, value: Boolean(value) };
        case "number":
            return { ...parameter, value: Number(value) };
        case "string":
            if (typeof value !== "string") {
                throw new Error(
                    `Value for Item parameter must be a string, got ${typeof value}`,
                );
            }
            return { ...parameter, value };
        case "Item":
            if (
                typeof value === "string" ||
                typeof value === "boolean" ||
                typeof value === "number"
            ) {
                throw new Error(
                    `Value for Item parameter must be an Item, got ${typeof value}`,
                );
            }
            return { ...parameter, value };
    }
}

export type StoredScript = CodeoScript & {
    id: string;
    createdAt: number;
    updatedAt: number;
    runAt: number;
    parameters: ParameterWithValue[];
};

export type PlayerStorage = Readonly<{
    // Persistent values
    hasSensibleValues: boolean;
    scripts: StoredScript[];
    toolEnabled: boolean;
    toolMappings: Partial<Record<Shortcut, string>>; // Map letter to script ID
    [SET_SENSIBLE](this: void): void;
    setToolEnabled(this: void, enabled: boolean): void;
    setToolShortcut(this: void, shortcut: Shortcut, scriptId: string): void;
    removeToolShortcut(this: void, shortcut: Shortcut): void;
    addScript(this: void, script: CodeoScript): void;
    removeScript(this: void, id: string): void;
    updateScript(this: void, id: string, updates: Partial<CodeoScript>): void;
    setParameterValue(
        this: void,
        scriptId: string,
        paramIndex: number,
        value: ParameterWithValue["value"],
    ): void;
    markScriptRun(this: void, id: string): void;

    // Temporary values
    executions: Map<string, Execution[]>;
    addExecution(this: void, scriptId: string, execution: Execution): void;
    stopExecution(
        this: void,
        scriptId: string,
        executionId: string,
    ): Promise<void>;

    // Tracking OBR
    sceneReady: boolean;
    playerColor: string;
    playerName: string;
    setSceneReady(this: void, sceneReady: boolean): void;
    setPlayerColor(this: void, playerColor: string): void;
    setPlayerName(this: void, playerName: string): void;
}>;

export const usePlayerStorage = create<PlayerStorage>()(
    subscribeWithSelector(
        persist(
            immer((set) => ({
                hasSensibleValues: false,
                scripts: [],
                toolEnabled: false,
                toolMappings: {},
                executions: new Map(),
                sceneReady: false,
                playerColor: "#FFFFFF",
                playerName: "Placeholder",
                [SET_SENSIBLE]: () => set({ hasSensibleValues: true }),
                setToolEnabled: (toolEnabled) => set({ toolEnabled }),
                setToolShortcut: (shortcut, scriptId) => {
                    set((state) => {
                        state.toolMappings[shortcut] = scriptId;
                    });
                    void setShortcutEnabledUi(shortcut, true);
                },
                removeToolShortcut: (shortcut) => {
                    set((state) => {
                        delete state.toolMappings[shortcut];
                    });
                    void setShortcutEnabledUi(shortcut, false);
                },
                addScript: (scriptData) =>
                    set((state) => {
                        const now = Date.now();
                        state.scripts.push({
                            ...scriptData,
                            id: crypto.randomUUID(),
                            createdAt: now,
                            updatedAt: now,
                            runAt: 0,
                        });
                    }),
                removeScript: (id) =>
                    set((state) => {
                        // remove executions for the script
                        const scriptExecutions = state.executions.get(id) ?? [];
                        for (const execution of scriptExecutions) {
                            execution.stop();
                        }
                        state.executions.delete(id);

                        // remove mappings to the script
                        for (const [shortcut, scriptId] of Object.entries(
                            state.toolMappings,
                        )) {
                            if (scriptId === id) {
                                state.removeToolShortcut(shortcut as Shortcut); // object entries doesn't keep key type info apparently
                            }
                        }

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
                stopExecution: async (scriptId, executionId) => {
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
                    });
                    await clearExecution(executionId);
                },
                setSceneReady: (sceneReady: boolean) => set({ sceneReady }),
                setPlayerColor: (playerColor) => set({ playerColor }),
                setPlayerName: (playerName) => set({ playerName }),
                setParameterValue: (scriptId, paramIndex, value) =>
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
                        state.scripts[scriptIdx].parameters[paramIndex] =
                            withValue(
                                state.scripts[scriptIdx].parameters[paramIndex],
                                value,
                            );
                    }),
                markScriptRun: (scriptId) =>
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
                        state.scripts[scriptIdx].runAt = Date.now();
                    }),
            })),
            {
                name: LOCAL_STORAGE_STORE_NAME,
                partialize: ({
                    scripts,
                    hasSensibleValues,
                    toolEnabled,
                    toolMappings,
                }) => ({
                    scripts,
                    hasSensibleValues,
                    toolEnabled,
                    toolMappings,
                }),
            },
        ),
    ),
);
