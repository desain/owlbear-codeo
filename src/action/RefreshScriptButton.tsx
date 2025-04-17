import { Update } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { importScript } from "../importScript";
import { StoredScript, usePlayerStorage } from "../state/usePlayerStorage";

export function RefreshScriptButton({ script }: { script: StoredScript }) {
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
