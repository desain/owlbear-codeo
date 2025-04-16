import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import { PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import { LOCATION_X_PARAM, LOCATION_Y_PARAM } from "../constants";
import { startSyncing } from "../state/startSyncing";
import { AddButton } from "./AddButton";

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
    const x = parseFloat(urlParams.get(LOCATION_X_PARAM) ?? "");
    const y = parseFloat(urlParams.get(LOCATION_Y_PARAM) ?? "");

    if (isNaN(x) || isNaN(y)) {
        throw new Error("Missing position parameters");
    }

    root.render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <AddButton position={{ x, y }} />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>,
    );
});
