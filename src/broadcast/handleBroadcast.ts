import OBR from "@owlbear-rodeo/sdk";
import { isObject } from "owlbear-utils";
import { MESSAGE_CHANNEL, METADATA_EXECUTION_ID_KEY } from "../constants";
import { deleteScript } from "../script/deleteScript";
import { runScript } from "../script/runScript";
import { BACKGROUND_OFF, isScriptButton } from "../ScriptButton";
import type { StoredScript } from "../state/StoredScript";
import { usePlayerStorage } from "../state/usePlayerStorage";
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
    const state = usePlayerStorage.getState();
    const script =
        "id" in selector
            ? state.getScriptById(selector.id)?.[0]
            : state.getScriptByName(selector.name);
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
        if (!script) {
            return;
        }
        await deleteScript(script.id);
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
