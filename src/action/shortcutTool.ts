import OBR from "@owlbear-rodeo/sdk";
import logo from "../../assets/logo.svg";
import {
    SHORTCUT_OPTIONS,
    SHORTCUT_TOOL_ACTION_ID_PREFIX,
    SHORTCUT_TOOL_ID,
} from "../constants";
import { runScript } from "../runScript";
import { usePlayerStorage } from "../state/usePlayerStorage";

export function enabledKey(shortcut: string) {
    return `${shortcut}/enabled`;
}

export function executionKey(shortcut: string) {
    return `${shortcut}/executionId`;
}

export async function startWatchingToolEnabled(): Promise<VoidFunction> {
    if (usePlayerStorage.getState().toolEnabled) {
        await installTool();
    }
    return usePlayerStorage.subscribe(
        (store) => store.toolEnabled,
        async (enabled) => {
            console.log(enabled);
            if (enabled) {
                await installTool();
            } else {
                await uninstallTool();
            }
        },
    );
}

async function installTool() {
    await Promise.all([
        OBR.tool.create({
            id: SHORTCUT_TOOL_ID,
            shortcut: ";",
            icons: [
                {
                    icon: logo,
                    label: "Codeo Shortcuts",
                },
            ],
            defaultMetadata: {},
        }),
        ...SHORTCUT_OPTIONS.map((letter) =>
            OBR.tool.createAction({
                id: SHORTCUT_TOOL_ACTION_ID_PREFIX + letter,
                shortcut: letter,
                icons: [
                    {
                        icon: logo, // TODO letter with dot
                        label: `Stop - ${letter}`, // TODO script name
                        filter: {
                            activeTools: [SHORTCUT_TOOL_ID],
                            metadata: [
                                {
                                    key: executionKey(letter),
                                    operator: "!=",
                                    value: undefined,
                                },
                            ],
                        },
                    },
                    {
                        icon: logo, // TODO letter
                        label: `Run script - ${letter}`, // TODO script name
                        filter: {
                            activeTools: [SHORTCUT_TOOL_ID],
                            metadata: [
                                {
                                    key: enabledKey(letter),
                                    value: true,
                                },
                            ],
                        },
                    },
                ],
                onClick: async (context) => {
                    const scriptId =
                        usePlayerStorage.getState().toolMappings[letter];
                    if (!scriptId) {
                        return;
                    }

                    const executionId = context.metadata[executionKey(letter)];

                    if (typeof executionId === "string") {
                        usePlayerStorage
                            .getState()
                            .stopExecution(scriptId, executionId);
                        await OBR.tool.setMetadata(SHORTCUT_TOOL_ID, {
                            [executionKey(letter)]: undefined,
                        });
                    } else {
                        const script = usePlayerStorage
                            .getState()
                            .scripts.find((script) => script.id === scriptId);

                        if (script === undefined) {
                            void OBR.notification.show(
                                `Script for shortcut ${letter} not found`,
                                "ERROR",
                            );
                            return;
                        }
                        const newExecutionId = await runScript(script);
                        if (newExecutionId) {
                            await OBR.tool.setMetadata(SHORTCUT_TOOL_ID, {
                                [executionKey(letter)]: newExecutionId,
                            });
                        }
                    }
                },
            }),
        ),
    ]);
}

function uninstallTool() {
    return OBR.tool.remove(SHORTCUT_TOOL_ID);
}
