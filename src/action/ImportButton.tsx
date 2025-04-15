import { Link } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { CodeoScript, isCodeoScript } from "../CodeoScript";
import { PlayerLocalStorage } from "../state/usePlayerStorage";

async function importFromUrl(): Promise<Omit<
    CodeoScript,
    "createdAt" | "updatedAt"
> | null> {
    const url = window.prompt("Enter URL of the script JSON:");
    if (!url) {
        return null;
    }

    try {
        const response = await fetch(url);
        const text = await response.text();

        try {
            const json: unknown = JSON.parse(text);
            if (!isCodeoScript(json)) {
                throw new Error("Invalid script format");
            }
            return json;
        } catch (SyntaxError) {
            console.log("Not json, trying to parse as code");
        }

        return {
            id: crypto.randomUUID(),
            name: "Imported Script",
            description: response.url,
            code: text,
        };
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
