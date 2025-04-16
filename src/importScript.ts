import OBR from "@owlbear-rodeo/sdk";
import { CodeoScript, isCodeoScript } from "./CodeoScript";

function guessName(url: string): string | null {
    const match = url.match(/\/([^\/?#]+)\.(json|js)(?:[?#].*)?$/i);
    if (match && match[1]) {
        const name = match[1];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return null;
}

function guessAuthor(url: string): string | undefined {
    const match = url.match(
        /^https?:\/\/gist\.github(usercontent)?\.com\/([^/]+)\//,
    );
    if (match && match[2]) {
        return match[2];
    }
    return undefined;
}

function getRaw(url: string): string {
    const match = url.match(/^https?:\/\/gist\.github\.com\/[^/]+\/\w+\/?$/);
    if (match) {
        return url + "/raw";
    }
    return url;
}

export async function importScript(
    url: string,
): Promise<Omit<CodeoScript, "createdAt" | "updatedAt"> | null> {
    url = getRaw(url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const text = await response.text();

        try {
            const json: unknown = JSON.parse(text);
            if (!isCodeoScript(json)) {
                throw new Error("Invalid script format");
            }
            return { ...json, url };
        } catch (SyntaxError) {
            console.log("Not json, trying to parse as code");
        }

        return {
            id: crypto.randomUUID(),
            name: guessName(url) ?? "Imported script",
            author: guessAuthor(url),
            description: "",
            url,
            code: text,
        };
    } catch (error) {
        const message = "Failed to import script:" + error;
        console.error(message);
        void OBR.notification.show(message, "ERROR");
        return null;
    }
}
