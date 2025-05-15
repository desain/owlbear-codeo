import OBR from "@owlbear-rodeo/sdk";
import { getId } from "owlbear-utils";
import { isShortcut, METADATA_SCRIPT_ID_KEY } from "../constants";
import { isScriptButton } from "../ScriptButton";
import {
    ScriptContainerUtils,
    withLocalAndRemoteContainers,
} from "../state/ScriptContainerUtils";
import { usePlayerStorage } from "../state/usePlayerStorage";

/**
 * Stop all executions, remove all tool mappings, and delete all buttons
 * for the given script.
 */
export async function removeReferencesToScripts(scriptIds: string[]) {
    const state = usePlayerStorage.getState();

    // Stop all executions for the script
    for (const scriptId of scriptIds) {
        const scriptExecutions = state.executions.get(scriptId) ?? [];
        for (const execution of scriptExecutions) {
            execution.stop();
            state.removeExecution(scriptId, execution.executionId);
        }
    }

    // remove mappings to the script
    for (const [shortcut, scriptId] of Object.entries(state.toolMappings)) {
        if (scriptIds.includes(scriptId) && isShortcut(shortcut)) {
            state.removeToolShortcut(shortcut);
        }
    }

    // Remove any buttons for the script
    const buttons = await OBR.scene.items.getItems(
        (button) =>
            isScriptButton(button) &&
            scriptIds.includes(button.metadata[METADATA_SCRIPT_ID_KEY]),
    );
    await OBR.scene.items.deleteItems([
        ...buttons.map(getId),
        ...buttons
            .map((button) => button.attachedTo)
            .filter((id) => id !== undefined),
    ]);
}

export async function deleteScript(scriptId: string) {
    await removeReferencesToScripts([scriptId]);

    // Remove the script from state
    await withLocalAndRemoteContainers((container) => {
        ScriptContainerUtils.remove(container, scriptId);
    });
}
