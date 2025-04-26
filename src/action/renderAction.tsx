import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll, PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../assets/style.css";
import { version } from "../../package.json";
import { MESSAGE_CHANNEL } from "../constants";
import { startSyncing } from "../state/startSyncing";
import { Action } from "./Action";
import { installContextMenu as createContextMenu } from "./createContextMenu";
import { handleBroadcast } from "./handleBroadcast";
import { startWatchingToolEnabled } from "./shortcutTool";
import { startWatchingButtons } from "./watchButtonClicks";

let uninstall: VoidFunction = () => {};

function installBroadcastListener() {
    return OBR.broadcast.onMessage(MESSAGE_CHANNEL, ({ data }) =>
        handleBroadcast(data),
    );
}

async function installExtension(): Promise<VoidFunction> {
    console.log(`Owlbear Codeo version ${version}`);

    const [storeInitialized, stopSyncing] = startSyncing();
    await storeInitialized;
    const uninstallBroadcastListener = installBroadcastListener();
    const stopWatchingButtons = startWatchingButtons();
    const stopWatchingTool = await startWatchingToolEnabled();
    await createContextMenu();

    return deferCallAll(
        () => console.log("Uninstalling Owlbear Codeo"),
        stopSyncing,
        stopWatchingButtons,
        stopWatchingTool,
        uninstallBroadcastListener,
    );
}

document.addEventListener("DOMContentLoaded", () => {
    const root = ReactDOM.createRoot(document.getElementById("reactApp")!);
    root.render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <Action />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>,
    );
});

OBR.onReady(async () => {
    // console.log("onReady");

    if (await OBR.scene.isReady()) {
        // console.log("isReady");
        uninstall = await installExtension();
    }

    OBR.scene.onReadyChange(async (ready) => {
        // console.log("onReadyChange", ready);
        if (ready) {
            uninstall = await installExtension();
        } else {
            uninstall();
            uninstall = () => {};
        }
    });
});
