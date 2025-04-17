import { CssBaseline } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import { SCRIPT_ID_PARAM } from "../constants";
import { startSyncing } from "../state/startSyncing";
import { EditScript } from "./EditScript";

if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.dispose(() => {
        console.log("Disposing");
        root?.unmount();
        root = null;
        return;
    });
}

let root: ReactDOM.Root | null = null;

OBR.onReady(() => {
    void startSyncing();
});

document.addEventListener("DOMContentLoaded", () => {
    root = ReactDOM.createRoot(document.getElementById("reactApp")!);

    const urlParams = new URLSearchParams(window.location.search);
    const scriptId = urlParams.get(SCRIPT_ID_PARAM);

    root.render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <EditScript scriptId={scriptId} />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>,
    );
});
