import OBR from "@owlbear-rodeo/sdk";

import logo from "../../assets/logo.svg";

import b from "../../assets/b.svg";
import bStop from "../../assets/bStop.svg";
import c from "../../assets/c.svg";
import cStop from "../../assets/cStop.svg";
import e from "../../assets/e.svg";
import eStop from "../../assets/eStop.svg";
import f from "../../assets/f.svg";
import fStop from "../../assets/fStop.svg";
import g from "../../assets/g.svg";
import gStop from "../../assets/gStop.svg";
import l from "../../assets/l.svg";
import lStop from "../../assets/lStop.svg";
import n from "../../assets/n.svg";
import nStop from "../../assets/nStop.svg";
import o from "../../assets/o.svg";
import oStop from "../../assets/oStop.svg";
import p from "../../assets/p.svg";
import pStop from "../../assets/pStop.svg";
import r from "../../assets/r.svg";
import rStop from "../../assets/rStop.svg";
import v from "../../assets/v.svg";
import vStop from "../../assets/vStop.svg";
import x from "../../assets/x.svg";
import xStop from "../../assets/xStop.svg";

import { broadcast } from "../broadcast/handleBroadcast";
import type { Shortcut } from "../constants";
import {
    SHORTCUT_OPTIONS,
    SHORTCUT_TOOL_ACTION_ID_PREFIX,
    SHORTCUT_TOOL_ID,
} from "../constants";
import { runScript } from "../script/runScript";
import { usePlayerStorage } from "../state/usePlayerStorage";

const ICONS: Record<Shortcut, string> = {
    b,
    c,
    e,
    f,
    g,
    l,
    n,
    o,
    p,
    r,
    v,
    x,
};

const STOP_ICONS: Record<Shortcut, string> = {
    b: bStop,
    c: cStop,
    e: eStop,
    f: fStop,
    g: gStop,
    l: lStop,
    n: nStop,
    o: oStop,
    p: pStop,
    r: rStop,
    v: vStop,
    x: xStop,
};

/**
 * Clear the execution record for the given execution ID. Does not actually stop
 * the execution.
 */
export async function clearExecutionsFromTool(executionId: string) {
    const toolMetadata = await OBR.tool.getMetadata(SHORTCUT_TOOL_ID);
    if (!toolMetadata) {
        return;
    }
    for (const letter of SHORTCUT_OPTIONS) {
        const letterExecution = toolMetadata[executionKey(letter)];
        if (letterExecution === executionId) {
            await OBR.tool.setMetadata(SHORTCUT_TOOL_ID, {
                [executionKey(letter)]: undefined,
            });
        }
    }
}

export async function getExecution(
    shortcut: Shortcut,
): Promise<string | undefined> {
    const toolMetadata = await OBR.tool.getMetadata(SHORTCUT_TOOL_ID);
    if (toolMetadata === undefined) {
        return undefined;
    }
    const value = toolMetadata[executionKey(shortcut)];
    if (typeof value === "string") {
        return value;
    }
    return undefined;
}

export async function setShortcutEnabledUi(
    shortcut: Shortcut,
    enabled: boolean,
) {
    return OBR.tool.setMetadata(SHORTCUT_TOOL_ID, {
        [enabledKey(shortcut)]: enabled,
    });
}

function enabledKey(shortcut: Shortcut) {
    return `${shortcut}/enabled`;
}

function executionKey(shortcut: Shortcut) {
    return `${shortcut}/executionId`;
}

export async function startWatchingToolEnabled(): Promise<VoidFunction> {
    if (usePlayerStorage.getState().toolEnabled) {
        await installTool();
    }
    return usePlayerStorage.subscribe(
        (store) => store.toolEnabled,
        async (enabled) => {
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
                shortcut: letter.toUpperCase(),
                icons: [
                    {
                        icon: STOP_ICONS[letter],
                        label: `Stop script ${letter.toUpperCase()}`, // TODO script name
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
                        icon: ICONS[letter],
                        label: `Run script ${letter.toUpperCase()}`, // TODO script name
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
                    const state = usePlayerStorage.getState();

                    const scriptId = state.toolMappings[letter];
                    if (!scriptId) {
                        return;
                    }

                    const executionId = context.metadata[executionKey(letter)];

                    if (typeof executionId === "string") {
                        await broadcast({
                            type: "STOP_EXECUTION",
                            id: scriptId,
                            executionId,
                        });
                    } else {
                        const script = state.scripts.find(
                            (script) => script.id === scriptId,
                        );

                        if (script === undefined) {
                            void OBR.notification.show(
                                `Script for shortcut ${letter} not found`,
                                "ERROR",
                            );
                            return;
                        }

                        // re-select whatever we selected last, since activating
                        // this shortcut cleared the selection
                        await OBR.player.select(
                            state.lastNonemptySelection,
                            true,
                        );

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

    // Set up tool metadata
    const enabledKeys: [shortcut: string, enabled: boolean][] =
        SHORTCUT_OPTIONS.map((shortcut) => [
            enabledKey(shortcut),
            usePlayerStorage.getState().toolMappings[shortcut] !== undefined,
        ]);
    const executionKeys: [shortcut: string, executionId: string | undefined][] =
        SHORTCUT_OPTIONS.map((shortcut) => [executionKey(shortcut), undefined]);
    await OBR.tool.setMetadata(
        SHORTCUT_TOOL_ID,
        Object.fromEntries<unknown>([...enabledKeys, ...executionKeys]),
    );
}

async function uninstallTool() {
    const state = usePlayerStorage.getState();
    const toolMetadata = await OBR.tool.getMetadata(SHORTCUT_TOOL_ID);
    if (toolMetadata) {
        for (const shortcut of SHORTCUT_OPTIONS) {
            const executionId = toolMetadata[executionKey(shortcut)];
            if (typeof executionId === "string") {
                const scriptId = state.toolMappings[shortcut];
                if (scriptId) {
                    // TODO stop multiple executions at once
                    void broadcast({
                        type: "STOP_EXECUTION",
                        id: scriptId,
                        executionId,
                    });
                }
            }
        }
    }

    await OBR.tool.remove(SHORTCUT_TOOL_ID);
}
