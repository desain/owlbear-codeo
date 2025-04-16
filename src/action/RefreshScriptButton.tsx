import { Update } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { CodeoScript } from "../CodeoScript";
import { importScript } from "../importScript";
import { usePlayerStorage } from "../state/usePlayerStorage";

export function RefreshScriptButton({ script }: { script: CodeoScript }) {
    const updateScript = usePlayerStorage((store) => store.updateScript);

    return (
        <Tooltip title="Fetch latest script">
            <IconButton
                onClick={async () => {
                    if (!script.url) {
                        return;
                    }
                    const updated = await importScript(script.url);
                    if (!updated) {
                        return;
                    }
                    updateScript(script.id, updated);
                    OBR.notification.show("Updated script", "SUCCESS");
                }}
            >
                <Update />
            </IconButton>
        </Tooltip>
    );
}
