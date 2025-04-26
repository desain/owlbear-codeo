import CssBaseline from "@mui/material/CssBaseline";
import OBR from "@owlbear-rodeo/sdk";
import { PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import { startSyncing } from "../state/startSyncing";
import { Settings } from "./Settings";

OBR.onReady(() => {
    void startSyncing();
});

document.addEventListener("DOMContentLoaded", () => {
    const root = ReactDOM.createRoot(document.getElementById("reactApp")!);

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
