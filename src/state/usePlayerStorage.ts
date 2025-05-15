import type { Metadata, Player } from "@owlbear-rodeo/sdk";
import { enableMapSet } from "immer";
import type { Role } from "owlbear-utils";
import { getOrInsert } from "owlbear-utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { CodeoScript } from "../CodeoScript";
import type { Shortcut } from "../constants";
import {
    LOCAL_STORAGE_STORE_NAME,
    METADATA_KEY_ROOM_METADATA,
} from "../constants";
import type { Execution } from "../Execution";
import { setShortcutEnabledUi } from "../tool/shortcutTool";
import { isRoomMetadata, type RoomMetadata } from "./RoomMetadata";
import type { ParameterWithValue, StoredScript } from "./StoredScript";

enableMapSet();

const SET_SENSIBLE = Symbol("SetSensible");

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

export interface PlayerStorage {
    // Persistent values
    readonly hasSensibleValues: boolean;
    readonly scripts: StoredScript[];
    readonly toolEnabled: boolean;
    readonly contextMenuEnabled: boolean;
    readonly toolMappings: Partial<Record<Shortcut, string>>;
    readonly [SET_SENSIBLE]: (this: void) => void;
    readonly setToolEnabled: (this: void, enabled: boolean) => void;
    readonly setContextMenuEnabled: (this: void, enabled: boolean) => void;
    readonly setToolShortcut: (
        this: void,
        shortcut: Shortcut,
        scriptId: string,
    ) => void;
    readonly removeToolShortcut: (this: void, shortcut: Shortcut) => void;
    readonly addScript: (this: void, script: CodeoScript) => void;
    readonly removeScript: (this: void, id: string) => void;
    readonly updateScript: (
        this: void,
        id: string,
        updates: Partial<CodeoScript>,
    ) => void;
    readonly setParameterValue: (
        this: void,
        scriptId: string,
        paramIndex: number,
        value: ParameterWithValue["value"],
    ) => void;
    /**
     * Update the script's runtime to now.
     */
    readonly markScriptRun: (this: void, id: string) => void;

    // Temporary values
    /**
     * Map of script ID to list of its executions.
     */
    readonly executions: Map<string, Execution[]>;
    readonly addExecution: (
        this: void,
        scriptId: string,
        execution: Execution,
    ) => void;
    /**
     * Removes an execution, but doesn't stop it.
     */
    readonly removeExecution: (
        this: void,
        scriptId: string,
        executionId: string,
    ) => void;

    // Tracking OBR
    readonly sceneReady: boolean;
    readonly role: Role;
    readonly playerColor: string;
    readonly playerName: string;
    readonly lastNonemptySelection: string[];
    readonly roomMetadata: RoomMetadata;
    readonly setSceneReady: (this: void, sceneReady: boolean) => void;
    readonly handlePlayerUpdate: (
        this: void,
        player: Pick<Player, "role" | "color" | "name" | "selection">,
    ) => void;
    readonly handleRoomMetadataUpdate: (
        this: void,
        roomMetadata: Metadata,
    ) => void;
}

export const usePlayerStorage = create<PlayerStorage>()(
    subscribeWithSelector(
        persist(
            immer((set) => ({
                hasSensibleValues: false,
                scripts: [],
                toolEnabled: false,
                contextMenuEnabled: true,
                toolMappings: {},
                executions: new Map(),

                [SET_SENSIBLE]: () => set({ hasSensibleValues: true }),
                setToolEnabled: (toolEnabled) => set({ toolEnabled }),
                setContextMenuEnabled: (contextMenuEnabled) =>
                    set({ contextMenuEnabled }),
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
                removeScript: (id) => {
                    set((state) => {
                        state.executions.delete(id);
                        state.scripts = state.scripts.filter(
                            (script) => script.id !== id,
                        );
                    });
                },
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
                removeExecution: (scriptId, executionId) =>
                    set((state) => {
                        state.executions.set(
                            scriptId,
                            (state.executions.get(scriptId) ?? []).filter(
                                (execution) =>
                                    execution.executionId !== executionId,
                            ),
                        );
                    }),
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

                sceneReady: false,
                playerColor: "#FFFFFF",
                playerName: "Placeholder",
                lastNonemptySelection: [],
                role: "PLAYER",
                roomMetadata: { scripts: [] },
                setSceneReady: (sceneReady: boolean) => set({ sceneReady }),
                handlePlayerUpdate: (player) =>
                    set({
                        role: player.role,
                        playerName: player.name,
                        playerColor: player.color,
                        ...(player.selection?.length
                            ? { lastNonemptySelection: player.selection }
                            : null),
                    }),
                handleRoomMetadataUpdate: (metadata) => {
                    const roomMetadata = metadata[METADATA_KEY_ROOM_METADATA];
                    if (isRoomMetadata(roomMetadata)) {
                        set({ roomMetadata });
                    }
                },
            })),
            {
                name: LOCAL_STORAGE_STORE_NAME,
                partialize: ({
                    scripts,
                    hasSensibleValues,
                    contextMenuEnabled,
                    toolEnabled,
                    toolMappings,
                }) => ({
                    scripts,
                    hasSensibleValues,
                    contextMenuEnabled,
                    toolEnabled,
                    toolMappings,
                }),
            },
        ),
    ),
);
