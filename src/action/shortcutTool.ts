import OBR from "@owlbear-rodeo/sdk";
import logo from "../../assets/logo.svg";
import {
    SHORTCUT_OPTIONS,
    SHORTCUT_TOOL_ACTION_ID_PREFIX,
    SHORTCUT_TOOL_ID,
    SHORTCUT_TOOL_SETTINGS_ACTION_ID,
} from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";

export async function startWatchingToolEnabled(): Promise<VoidFunction> {
    if (usePlayerStorage.getState().toolEnabled) {
        await installTool();
    }
    return usePlayerStorage.subscribe(
        (store) => store.executions,
        async (enabled) => {
            if (enabled) {
                await installTool();
            } else {
                uninstallTool();
            }
        },
    );
}

async function installTool() {
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
    });
    await Promise.all([
        OBR.tool.createAction({
            id: SHORTCUT_TOOL_SETTINGS_ACTION_ID,
            icons: [
                {
                    icon: logo, // TODO gear
                    label: "Settings",
                    filter: {
                        activeTools: [SHORTCUT_TOOL_ID],
                    },
                },
            ],
            onClick() {
                // TODO open settings popover
                OBR.notification.show("YOU CLICKED SETTINGS", "WARNING");
            },
        }),
        ...SHORTCUT_OPTIONS.map((letter) =>
            OBR.tool.createAction({
                id: SHORTCUT_TOOL_ACTION_ID_PREFIX + letter,
                shortcut: letter,
                icons: [
                    {
                        icon: logo,
                        label: `Codeo Shortcuts - ${letter}`, // TODO script id
                        filter: {
                            activeTools: [SHORTCUT_TOOL_ID],
                            metadata: [
                                {
                                    key: letter,
                                    value: true,
                                },
                            ],
                        },
                    },
                ],
                onClick: async () => {
                    const scriptId = usePlayerStorage
                        .getState()
                        .toolMappings.get(letter);
                    await OBR.notification.show(
                        "You clicked " + letter + ", scriptId = " + scriptId,
                        "INFO",
                    );
                },
            }),
        ),
    ]);
}

async function uninstallTool() {
    OBR.tool.remove(SHORTCUT_TOOL_ID);
}
