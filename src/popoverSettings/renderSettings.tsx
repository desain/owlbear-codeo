import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import { PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import { startSyncing } from "../state/startSyncing";
import { Settings } from "./Settings";

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

    root.render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <Settings />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>,
    );
});
