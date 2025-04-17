import OBR from "@owlbear-rodeo/sdk";
import {
    CodeoScript,
    isCodeoScript,
    isParameterType,
    PARAMETER_TYPES,
} from "./CodeoScript";

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
/**
 * Parse the code and extract parameters header attributes.
 * @param code The code to parse.
 * @throws Error if the code is not valid.
 */
function parseCode(
    code: string,
): Pick<CodeoScript, "code" | "parameters"> &
    Partial<Pick<CodeoScript, HeaderAttr>> {
    const partial: Partial<Pick<CodeoScript, HeaderAttr>> = {};
    const parameters: CodeoScript["parameters"] = [];
    const parameterRegex = /^\s*\/\/\s*@param\s+(\w+)\s+(\w+)\s+(.+?)\s*$/;
    const lines = code.split(/\r?\n/);
    if (
        lines.length > 0 &&
        lines[0].search(/^\s*\/\/\s*@CodeoScript\s*$/) >= 0
    ) {
        for (let i = 1; i < lines.length; i++) {
            const headerAttrMatch = lines[i].match(HEADER_ATTR_REGEX);
            if (headerAttrMatch && headerAttrMatch[1] && headerAttrMatch[2]) {
                // Key must be header attr since regex is defined as only matching header attrs
                const key = headerAttrMatch[1] as HeaderAttr;
                partial[key] = headerAttrMatch[2];
                continue;
            }

            const parameterMatch = lines[i].match(parameterRegex);
            if (
                parameterMatch &&
                parameterMatch[1] &&
                parameterMatch[2] &&
                parameterMatch[3]
            ) {
                const name = parameterMatch[1];
                const type = parameterMatch[2];
                const description = parameterMatch[3];

                if (isParameterType(type)) {
                    parameters.push({
                        name,
                        type,
                        description,
                    });
                } else {
                    throw new Error(
                        `Invalid parameter type "${type}" for parameter "${name}". Must be one of ${PARAMETER_TYPES.map(
                            (type) => `"${type}"`,
                        ).join(", ")}.`,
                    );
                }

                continue;
            }

            // end of attr section
            break;
        }
    }
    return { ...partial, parameters, code };
}

/**
 * @param jsonOrCode The code to parse. Can be either a JSON representation of a script,
 * or the script source code.
 * @throws Error if the code is not valid as JSON or code with headers.
 */
export function parseJsonOrCode(jsonOrCode: string): Omit<CodeoScript, "name"> {
    try {
        const json: unknown = JSON.parse(jsonOrCode);
        if (isCodeoScript(json)) {
            return json;
        }
    } catch {
        console.log("Not json, trying to parse as code");
    }

    return parseCode(jsonOrCode);
}

export async function importScript(url: string): Promise<null | CodeoScript> {
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
