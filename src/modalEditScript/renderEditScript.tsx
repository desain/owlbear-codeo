import { CssBaseline } from "@mui/material";
import { PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import { SCRIPT_ID_PARAM } from "../constants";
import { startSyncing } from "../state/startSyncing";
import { StoreInitializedGate } from "../state/StoreInitializedGate";
import { EditScript } from "./EditScript";

document.addEventListener("DOMContentLoaded", () => {
    const root = ReactDOM.createRoot(document.getElementById("reactApp")!);

    const urlParams = new URLSearchParams(window.location.search);
    const scriptId = urlParams.get(SCRIPT_ID_PARAM) ?? undefined; // convert null

    root.render(
        <React.StrictMode>
            <PluginGate>
                <StoreInitializedGate startSyncing={startSyncing}>
                    <PluginThemeProvider>
                        <CssBaseline />
                        <EditScript scriptId={scriptId} />
                    </PluginThemeProvider>
                </StoreInitializedGate>
            </PluginGate>
        </React.StrictMode>,
    );
});
