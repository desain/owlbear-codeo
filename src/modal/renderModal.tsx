import { CssBaseline } from "@mui/material";
import { PluginGate, PluginThemeProvider } from "owlbear-utils";
import React from "react";
import ReactDOM from "react-dom/client";
import { SCRIPT_ID_PARAM } from "../constants";
import { Modal } from "./Modal";

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

document.addEventListener("DOMContentLoaded", () => {
    root = ReactDOM.createRoot(document.getElementById("reactApp")!);

    const urlParams = new URLSearchParams(window.location.search);
    const scriptId = urlParams.get(SCRIPT_ID_PARAM);

    root.render(
        <React.StrictMode>
            <PluginGate>
                <PluginThemeProvider>
                    <CssBaseline />
                    <Modal scriptId={scriptId} />
                </PluginThemeProvider>
            </PluginGate>
        </React.StrictMode>,
    );
});
