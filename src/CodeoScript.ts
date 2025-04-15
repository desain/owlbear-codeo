import { isObject } from "owlbear-utils";

export interface CodeoScript {
    id: string;
    name: string;
    description: string;
    code: string;
    createdAt: number;
    updatedAt: number;
}

export function isCodeoScript(script: unknown): script is CodeoScript {
    return (
        isObject(script) &&
        "id" in script &&
        typeof script.id === "string" &&
        "name" in script &&
        typeof script.name === "string" &&
        "description" in script &&
        typeof script.description === "string" &&
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
