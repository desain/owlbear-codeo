import { isObject } from "owlbear-utils";

export interface CodeoScript {
    name: string;
    author?: string;
    /**
     * URL the script was imported from. Used to dynamically reload scripts.
     */
    url?: string;
    description?: string;
    version?: string;
    code: string;
}

export function isCodeoScript(script: unknown): script is CodeoScript {
    return (
        isObject(script) &&
        "id" in script &&
        typeof script.id === "string" &&
        "name" in script &&
        typeof script.name === "string" &&
        (!("author" in script) || typeof script.author === "string") &&
        (!("url" in script) || typeof script.url === "string") &&
        (!("description" in script) ||
            typeof script.description === "string") &&
        (!("version" in script) || typeof script.version === "string") &&
        "code" in script &&
        typeof script.code === "string" &&
        "createdAt" in script &&
        typeof script.createdAt === "number" &&
        "updatedAt" in script &&
        typeof script.updatedAt === "number" &&
        "enabled" in script &&
        typeof script.enabled === "boolean"
    );
}
