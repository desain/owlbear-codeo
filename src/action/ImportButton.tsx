import { AddLink } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { importScript } from "../importScript";
import { PlayerStorage } from "../state/usePlayerStorage";

export function ImportButton({
    addScript,
}: {
    addScript: PlayerStorage["addScript"];
}) {
    return (
        <Tooltip title="Import script from URL">
            <IconButton
                onClick={async () => {
                    const url = window.prompt("Enter script URL");
                    if (!url) {
                        return;
                    }
                    const script = await importScript(url);
                    if (!script) {
                        return;
                    }
                    addScript(script);
                }}
            >
                <AddLink />
            </IconButton>
        </Tooltip>
    );
}
