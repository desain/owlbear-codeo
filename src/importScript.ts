import OBR from "@owlbear-rodeo/sdk";
import { CodeoScript, isCodeoScript } from "./CodeoScript";

function guessName(url: string): string | undefined {
    const match = url.match(/\/([^\/?#]+)\.(json|js)(?:[?#].*)?$/i);
    if (match && match[1]) {
        const name = match[1];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return undefined;
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

const HEADER_ATTRS = [
    "name",
    "author",
    "description",
    "version",
] as const satisfies (keyof CodeoScript)[];
type HeaderAttr = (typeof HEADER_ATTRS)[number];
const HEADER_ATTR_REGEX = new RegExp(
    `^\\s*//\\s*@(${HEADER_ATTRS.join("|")})\\s+(.+?)\\s*$`,
);
function parseCode(
    code: string,
): Pick<CodeoScript, "code"> & Partial<Pick<CodeoScript, HeaderAttr>> {
    const partial: Partial<Pick<CodeoScript, HeaderAttr>> = {};
    const lines = code.split(/\r?\n/);
    if (
        lines.length > 0 &&
        lines[0].search(/^\s*\/\/\s*@CodeoScript\s*$/) >= 0
    ) {
        for (let i = 1; i < lines.length; i++) {
            const match = lines[i].match(HEADER_ATTR_REGEX);
            if (match && match[1] && match[2]) {
                // Key must be header attr since regex is defined as only matching header attrs
                const key = match[1] as HeaderAttr;
                partial[key] = match[2];
            } else {
                // end of attr section
                break;
            }
        }
    }
    return { ...partial, code };
}

export function parseJsonOrCode(
    jsonOrCode: string,
): Omit<CodeoScript, "name" | "createdAt" | "updatedAt"> {
    try {
        const json: unknown = JSON.parse(jsonOrCode);
        if (isCodeoScript(json)) {
            return json;
        }
    } catch {
        console.log("Not json, trying to parse as code");
    }

    return {
        ...parseCode(jsonOrCode),
        id: crypto.randomUUID(),
    };
}

export async function importScript(
    url: string,
): Promise<null | Omit<CodeoScript, "createdAt" | "updatedAt">> {
    url = getRaw(url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const text = await response.text();

        return {
            name: guessName(url) ?? "Imported Script",
            author: guessAuthor(url),
            ...parseJsonOrCode(text),
            url,
        };
    } catch (error) {
        const message = "Failed to import script:" + error;
        console.error(message);
        void OBR.notification.show(message, "ERROR");
        return null;
    }
}
