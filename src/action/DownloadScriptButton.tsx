import { Download } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { CodeoScript } from "../CodeoScript";
import { toJsScript } from "../utils/parseScript";

function handleDownload(script: CodeoScript) {
    const scriptText = toJsScript(script);
    const blob = new Blob([scriptText], { type: "text/plain;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.name}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function DownloadScriptButton({ script }: { script: CodeoScript }) {
    return (
        <Tooltip title="Download script">
            <IconButton onClick={() => handleDownload(script)}>
                <Download />
            </IconButton>
        </Tooltip>
    );
}
