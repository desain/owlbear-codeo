import { AddLink } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { CodeoScript, isCodeoScript } from "../CodeoScript";
import { PlayerLocalStorage } from "../state/usePlayerStorage";

function guessName(url: string) {
    const match = url.match(/\/([^\/?#]+)\.(json|js)(?:[?#].*)?$/i);
    if (match && match[1]) {
        const name = match[1];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "Imported Script";
}

function getRaw(url: string | null): string | null {
    if (url === null) {
        return null;
    }
    const match = url.match(/^https?:\/\/gist\.github\.com\/[^/]+\/\w+\/?$/);
    if (match) {
        return url + "/raw";
    }
    return url;
}

async function importFromUrl(): Promise<Omit<
    CodeoScript,
    "createdAt" | "updatedAt"
> | null> {
    const url = getRaw(window.prompt("Enter URL of the script JSON:"));
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
            name: guessName(url),
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
        <Tooltip title="Import script from URL">
            <IconButton
                color="primary"
                onClick={async () => {
                    const script = await importFromUrl();
                    if (script) {
                        addScript(script);
                    }
                }}
            >
                <AddLink />
            </IconButton>
        </Tooltip>
    );
}
