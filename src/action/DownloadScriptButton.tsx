import { Download } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { CodeoScript } from "../CodeoScript";

function handleDownload(script: CodeoScript) {
    const scriptJson = JSON.stringify(script, null, 2);
    const blob = new Blob([scriptJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function DownloadScriptButton({ script }: { script: CodeoScript }) {
    return (
        <Tooltip title="Download script">
            <IconButton color="primary" onClick={() => handleDownload(script)}>
                <Download />
            </IconButton>
        </Tooltip>
    );
}
