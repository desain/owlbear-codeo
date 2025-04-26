import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll, PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../assets/style.css";
import { version } from "../../dist/manifest.json";
import { startWatchingContextMenuEnabled } from "../contextmenu/contextmenu";
import { startSyncing } from "../state/startSyncing";
import { startWatchingToolEnabled } from "../tool/shortcutTool";
import { Action } from "./Action";
import { installBroadcastListener } from "./handleBroadcast";
import { startWatchingButtons } from "./watchButtonClicks";

let uninstall: VoidFunction = () => {};

async function installExtension(): Promise<VoidFunction> {
    console.log(`Owlbear Codeo version ${version}`);

    const [storeInitialized, stopSyncing] = startSyncing();
    await storeInitialized;
    const uninstallBroadcastListener = installBroadcastListener();
    const stopWatchingButtons = startWatchingButtons();
    const stopWatchingTool = await startWatchingToolEnabled();
    const stopWatchingContextMenu = await startWatchingContextMenuEnabled();

    return deferCallAll(
        () => console.log("Uninstalling Owlbear Codeo"),
        stopSyncing,
        stopWatchingButtons,
        stopWatchingTool,
        stopWatchingContextMenu,
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
