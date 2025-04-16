import { PlayArrow } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { CodeoScript } from "../CodeoScript";
import { runScript } from '../runScript';

export function RunScriptButton({ script }: { script: CodeoScript }) {
    return (
        <Tooltip title="Run script">
            <IconButton color="primary" onClick={() => runScript(script)}>
                <PlayArrow />
            </IconButton>
        </Tooltip>
    );
}
