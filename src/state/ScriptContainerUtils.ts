import type { WritableDraft } from "immer";
import type { CodeoScript } from "../script/CodeoScript";
import { updateRoomMetadata } from "./RoomMetadata";
import type { ParameterWithValue, StoredScript } from "./StoredScript";
import { usePlayerStorage } from "./usePlayerStorage";

// Methods to mutate a script container

/**
 * Any container of scripts -
 */
export interface ScriptContainer {
    scripts: StoredScript[];
}

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
        case "ItemList": // Added ItemList case
            if (!Array.isArray(value) && value !== undefined) { // value can be undefined to clear it
                throw new Error(
                    `Value for ItemList parameter must be an array or undefined, got ${typeof value}`,
                );
            }
            // Ensure all elements are items if the array is not undefined
            if (Array.isArray(value) && !value.every(item => typeof item === 'object' && item !== null && 'id'in item)) {
                 throw new Error(
                    `All elements in ItemList parameter must be Item objects`,
                );
            }
            return { ...parameter, value };
    }
}

export const ScriptContainerUtils = {
    /**
     * Add the given script, giving it an ID and storage params.
     */
    add: (container: ScriptContainer, script: CodeoScript) => {
        const now = Date.now();
        container.scripts.push({
            ...script,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
            runAt: 0,
        });
    },

    /**
     * Add the given script exactly, without changing ID.
     */
    addStored: (container: ScriptContainer, script: StoredScript) => {
        container.scripts.push(script);
    },

    update: (
        container: ScriptContainer,
        id: string,
        updates: Partial<CodeoScript>,
    ) => {
        container.scripts = container.scripts.map((script) =>
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
    },

    remove: (container: ScriptContainer, id: string) => {
        container.scripts = container.scripts.filter(
            (script) => script.id !== id,
        );
    },

    removeAll: (container: ScriptContainer, ids: Set<string>) => {
        container.scripts = container.scripts.filter(
            (script) => !ids.has(script.id),
        );
    },

    markRun: (container: ScriptContainer, id: string) => {
        const scriptIdx = container.scripts.findIndex(
            (script) => script.id === id,
        );
        const script = container.scripts[scriptIdx];
        if (!script) {
            return;
        }
        script.runAt = Date.now();
    },

    setParameterValue: (
        container: ScriptContainer,
        scriptId: string,
        paramIndex: number,
        value: ParameterWithValue["value"],
    ) => {
        const scriptIdx = container.scripts.findIndex(
            (script) => script.id === scriptId,
        );
        const script = container.scripts[scriptIdx];
        if (!script) {
            return;
        }

        const param = script.parameters[paramIndex];
        if (!param) {
            console.warn(
                `Parameter index ${paramIndex} out of bounds for script with ID ${scriptId}`,
            );
            return;
        }
        script.parameters[paramIndex] = withValue(param, value);
    },
};

export async function withLocalAndRemoteContainers(
    updater: (draft: WritableDraft<ScriptContainer>) => void,
) {
    usePlayerStorage.getState().updateLocalStateContainer(updater);
    await updateRoomMetadata(updater);
}
