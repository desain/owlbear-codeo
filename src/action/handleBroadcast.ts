import OBR from "@owlbear-rodeo/sdk";
import { isObject } from "owlbear-utils";
import { CodeoScript } from "../CodeoScript";
import { runScript } from "../runScript";
import { StoredScript, usePlayerStorage } from "../state/usePlayerStorage";

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

type StopExecutionMessage = ScriptSelector & {
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

interface RunScriptMessageResponse {
    executionId: string;
}

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

export async function handleBroadcast(data: unknown) {
    if (isRunScriptMessage(data)) {
        const script = getScriptOrWarn(data);
        if (script) {
            const executionId = await runScript(script);
            if (executionId && data.replyTo) {
                const reply = {
                    executionId,
                } satisfies RunScriptMessageResponse;
                OBR.broadcast.sendMessage(
                    data.replyTo,
                    reply,
                    data.destination && { destination: data.destination },
                );
            }
        }
    } else if (isStopExecutionMessage(data)) {
        const script = getScriptOrWarn(data);
        if (script) {
            usePlayerStorage
                .getState()
                .stopExecution(script.id, data.executionId);
        }
    } else {
        void OBR.notification.show(
            "[Codeo] Ignoring invalid message",
            "WARNING",
        );
        console.warn("Invalid message format", data);
    }
}
