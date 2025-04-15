import { PlayArrow } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { CodeoScript } from "../CodeoScript";

const AsyncFunction = async function () {}.constructor;

async function handleRunScript(script: CodeoScript) {
    try {
        const scriptFunction = AsyncFunction(
            "OBR",
            "'use strict';" + script.code,
        );
        await scriptFunction(OBR);
    } catch (error) {
        console.error(`Error running script "${script.name}":`, error);
    }
}

export function RunScriptButton({ script }: { script: CodeoScript }) {
    return (
        <Tooltip title="Run script">
            <IconButton color="primary" onClick={() => handleRunScript(script)}>
                <PlayArrow />
            </IconButton>
        </Tooltip>
    );
}
