import OBR from "@owlbear-rodeo/sdk";
import { isCodeoScript } from "../CodeoScript";
import { PlayerLocalStorage } from "../state/usePlayerStorage";
import { Tooltip, IconButton, Link } from '@mui/material';

async function importFromUrl() {
    const url = window.prompt("Enter URL of the script JSON:");
    if (!url) {
        return undefined;
    }

    try {
        const response = await fetch(url);
        const data: unknown = await response.json();

        if (!isCodeoScript(data)) {
            throw new Error("Invalid script format");
        }

        const { id, createdAt, updatedAt, ...scriptData } = data;
        return scriptData;
    } catch (error) {
        const message = "Failed to import script:" + error;
        console.error(message);
        void OBR.notification.show(message, "ERROR");
        return null;
    }
}

export function ImportButton({
    addScript,
}: {
    addScript: PlayerLocalStorage["addScript"];
}) {
    return (
        <Tooltip title="Import from URL">
            <IconButton
                color="primary"
                onClick={async () => {
                    const script = await importFromUrl();
                    if (script) {
                        addScript(script);
                    }
                }}
            >
                <Link />
            </IconButton>
        </Tooltip>
    );
}
