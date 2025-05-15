import type { Metadata, Player } from "@owlbear-rodeo/sdk";
import type { WritableDraft } from "immer";
import { enableMapSet } from "immer";
import type { Role } from "owlbear-utils";
import { getOrInsert } from "owlbear-utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Shortcut } from "../constants";
import {
    LOCAL_STORAGE_STORE_NAME,
    METADATA_KEY_ROOM_METADATA,
} from "../constants";
import type { Execution } from "../Execution";
import type { CodeoScript } from "../script/CodeoScript";
import { removeReferencesToScripts } from "../script/deleteScript";
import { setShortcutEnabledUi } from "../tool/shortcutTool";
import { isRoomMetadata, type RoomMetadata } from "./RoomMetadata";
import type { ScriptContainer } from "./ScriptContainerUtils";
import { ScriptContainerUtils } from "./ScriptContainerUtils";
import type { StoredScript } from "./StoredScript";

enableMapSet();

export interface PlayerStorage {
    // Persistent values
    readonly scripts: StoredScript[];
    readonly toolEnabled: boolean;
    readonly contextMenuEnabled: boolean;
    readonly toolMappings: Partial<Record<Shortcut, string>>;
    readonly setToolEnabled: (this: void, enabled: boolean) => void;
    readonly setContextMenuEnabled: (this: void, enabled: boolean) => void;
    readonly setToolShortcut: (
        this: void,
        shortcut: Shortcut,
        scriptId: string,
    ) => void;
    readonly removeToolShortcut: (this: void, shortcut: Shortcut) => void;
    readonly updateLocalStateContainer: (
        this: void,
        updater: (draft: WritableDraft<ScriptContainer>) => void,
    ) => void;
    readonly addLocalScript: (this: void, script: CodeoScript) => void;
    readonly getAllScripts: (this: void) => StoredScript[];
    readonly getScriptByName: (
        this: void,
        name: string,
    ) => StoredScript | undefined;
    /**
     * Get script by ID. Don't call directly from React component, use useShallow
     * or useSelectedScript wrapper instead.
     */
    readonly getScriptById: (
        this: void,
        id: string | undefined,
    ) => [script: StoredScript, local: boolean] | undefined;
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
            immer((set, get) => ({
                scripts: [],
                toolEnabled: false,
                contextMenuEnabled: true,
                toolMappings: {},
                executions: new Map(),

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
                updateLocalStateContainer: (updater) =>
                    set((state) => {
                        updater(state);
                    }),
                addLocalScript: (scriptData) =>
                    set((state) => {
                        ScriptContainerUtils.add(state, scriptData);
                    }),
                getAllScripts: () => {
                    const state = get();
                    return [...state.scripts, ...state.roomMetadata.scripts];
                },
                getScriptByName: (name) => {
                    const state = get();
                    return (
                        state.scripts.find((script) => script.name === name) ??
                        state.roomMetadata.scripts.find(
                            (script) => script.name === name,
                        )
                    );
                },
                getScriptById: (id) => {
                    const state = get();
                    const localScript = state.scripts.find(
                        (script) => script.id === id,
                    );
                    if (localScript) {
                        return [localScript, true];
                    }
                    const roomScript = state.roomMetadata.scripts.find(
                        (script) => script.id === id,
                    );
                    if (roomScript) {
                        return [roomScript, false];
                    }
                    return undefined;
                },
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
                markScriptRun: (scriptId) =>
                    set((state) => {
                        ScriptContainerUtils.markRun(state, scriptId);
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
                handleRoomMetadataUpdate: async (metadata) => {
                    const roomMetadata = metadata[METADATA_KEY_ROOM_METADATA];
                    if (isRoomMetadata(roomMetadata)) {
                        // Delete all current scripts that aren't kept in the new room metadata
                        const toDelete = new Set(
                            get().roomMetadata.scripts.map(
                                (script) => script.id,
                            ),
                        );
                        const toKeep = new Set(
                            roomMetadata.scripts.map((script) => script.id),
                        );
                        toKeep.forEach((id) => toDelete.delete(id));
                        await removeReferencesToScripts([...toDelete]);
                        // Remove local copies of scripts the room has
                        get().updateLocalStateContainer((container) => {
                            ScriptContainerUtils.removeAll(container, toKeep);
                        });
                        set({ roomMetadata });
                    }
                },
            })),
            {
                name: LOCAL_STORAGE_STORE_NAME,
                partialize: ({
                    scripts,
                    contextMenuEnabled,
                    toolEnabled,
                    toolMappings,
                }) => ({
                    scripts,
                    contextMenuEnabled,
                    toolEnabled,
                    toolMappings,
                }),
            },
        ),
    ),
);
