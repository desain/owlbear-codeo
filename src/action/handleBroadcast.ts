import OBR from "@owlbear-rodeo/sdk";
import { getId, isObject } from "owlbear-utils";
import { CodeoScript } from "../CodeoScript";
import {
    isShortcut,
    MESSAGE_CHANNEL,
    METADATA_EXECUTION_ID_KEY,
    METADATA_SCRIPT_ID_KEY,
} from "../constants";
import { runScript } from "../runScript";
import { BACKGROUND_OFF, isScriptButton } from "../ScriptButton";
import { StoredScript, usePlayerStorage } from "../state/usePlayerStorage";
import { clearExecutionsFromTool } from "../tool/shortcutTool";

type ScriptSelector = { name: string } | { id: string };
function isScriptSelector(message: unknown): message is ScriptSelector {
    return (
        isObject(message) &&
        (("name" in message && typeof message.name === "string") ||
            ("id" in message && typeof message.id === "string"))
    );
}

type RunScriptMessage = ScriptSelector & {
    type: "RUN_SCRIPT";
    replyTo?: string;
    destination?: NonNullable<
        Parameters<typeof OBR.broadcast.sendMessage>[2]
    >["destination"];
};
function isRunScriptMessage(message: unknown): message is RunScriptMessage {
    return (
        isScriptSelector(message) &&
        "type" in message &&
        message.type === "RUN_SCRIPT" &&
        (!("replyTo" in message) || typeof message.replyTo === "string")
    );
}

export type StopExecutionMessage = ScriptSelector & {
    type: "STOP_EXECUTION";
    executionId: string;
};
function isStopExecutionMessage(
    message: unknown,
): message is StopExecutionMessage {
    return (
        isScriptSelector(message) &&
        "type" in message &&
        message.type === "STOP_EXECUTION" &&
        "executionId" in message &&
        typeof message.executionId === "string"
    );
}

export type RemoveScriptMessage = ScriptSelector & {
    type: "REMOVE_SCRIPT";
};
function isRemoveScriptMessage(
    message: unknown,
): message is RemoveScriptMessage {
    return (
        isScriptSelector(message) &&
        "type" in message &&
        message.type === "REMOVE_SCRIPT"
    );
}

type RunScriptMessageResponse = Readonly<{
    executionId: string;
}>;

function getScriptOrWarn(selector: ScriptSelector): StoredScript | null {
    const finder =
        "id" in selector
            ? (s: StoredScript) => s.id === selector.id
            : (s: CodeoScript) => s.name === selector.name;
    const script = usePlayerStorage.getState().scripts.find(finder);
    if (!script) {
        void OBR.notification.show(
            `[Codeo] Script not found, ignoring`,
            "WARNING",
        );
        console.warn("Failed to find script", selector);
    }
    return script ?? null;
}

async function handleBroadcast(data: unknown) {
    if (isRunScriptMessage(data)) {
        const script = getScriptOrWarn(data);
        if (script === null) {
            return;
        }

        const executionId = await runScript(script);

        if (executionId && data.replyTo) {
            const reply = {
                executionId,
            } satisfies RunScriptMessageResponse;
            void OBR.broadcast.sendMessage(
                data.replyTo,
                reply,
                data.destination && { destination: data.destination },
            );
        }
    } else if (isStopExecutionMessage(data)) {
        const script = getScriptOrWarn(data);
        if (script === null) {
            return;
        }
        const state = usePlayerStorage.getState();
        const execution = (state.executions.get(script.id) ?? []).find(
            (execution) => execution.executionId === data.executionId,
        );

        // Stop the execution
        if (execution) {
            execution.stop();
        }

        // Remove execution from tool, update UI
        await clearExecutionsFromTool(data.executionId);

        // Reset any buttons tracking this execution
        await OBR.scene.items.updateItems(isScriptButton, (buttons) =>
            buttons.forEach((button) => {
                if (
                    button.metadata[METADATA_EXECUTION_ID_KEY] ===
                    data.executionId
                ) {
                    button.metadata[METADATA_EXECUTION_ID_KEY] = undefined;
                    button.style.backgroundColor = BACKGROUND_OFF;
                }
            }),
        );

        // Remove execution from state
        state.removeExecution(script.id, data.executionId);
    } else if (isRemoveScriptMessage(data)) {
        const script = getScriptOrWarn(data);
        if (script === null) {
            return;
        }
        const state = usePlayerStorage.getState();

        // Stop all executions for the script
        const scriptExecutions = state.executions.get(script.id) ?? [];
        for (const execution of scriptExecutions) {
            execution.stop();
        }

        // remove mappings to the script
        for (const [shortcut, scriptId] of Object.entries(state.toolMappings)) {
            if (scriptId === script.id && isShortcut(shortcut)) {
                state.removeToolShortcut(shortcut);
            }
        }

        // Remove any buttons for the script
        const buttons = await OBR.scene.items.getItems(
            (button) =>
                isScriptButton(button) &&
                button.metadata[METADATA_SCRIPT_ID_KEY] === script.id,
        );
        await OBR.scene.items.deleteItems([
            ...buttons.map(getId),
            ...buttons
                .map((button) => button.attachedTo)
                .filter((id) => id !== undefined),
        ]);

        // Remove the script from state
        state.removeScript(script.id);
    } else {
        void OBR.notification.show(
            "[Codeo] Ignoring invalid message",
            "WARNING",
        );
        console.warn("Invalid message format", data);
    }
}

export function installBroadcastListener() {
    return OBR.broadcast.onMessage(MESSAGE_CHANNEL, ({ data }) =>
        handleBroadcast(data),
    );
}

export function broadcast(
    message: RemoveScriptMessage | RunScriptMessage | StopExecutionMessage,
) {
    return OBR.broadcast.sendMessage(MESSAGE_CHANNEL, message, {
        destination: "LOCAL",
    });
}
