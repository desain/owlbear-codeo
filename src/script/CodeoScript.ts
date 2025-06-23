import { isObject } from "owlbear-utils";

export const PARAMETER_TYPES = ["boolean", "string", "number", "Item", "ItemList"] as const;
export type ParameterType = (typeof PARAMETER_TYPES)[number];
export function isParameterType(type: unknown): type is ParameterType {
    const parameterTypes2: readonly string[] = PARAMETER_TYPES;
    return typeof type === "string" && parameterTypes2.includes(type);
}

export type ScriptParameter = Readonly<{
    name: string;
    description: string;
    type: ParameterType;
}>;
export function isScriptParameter(parameter: unknown) {
    return (
        isObject(parameter) &&
        "name" in parameter &&
        typeof parameter.name === "string" &&
        "description" in parameter &&
        typeof parameter.description === "string" &&
        "type" in parameter &&
        isParameterType(parameter.type)
    );
}

export type CodeoScript = Readonly<{
    name: string;
    author?: string;
    /**
     * URL the script was imported from. Used to dynamically reload scripts.
     */
    url?: string;
    description?: string;
    version?: string;
    parameters: ScriptParameter[];
    code: string;
}>;

export function isCodeoScript(script: unknown): script is CodeoScript {
    return (
        isObject(script) &&
        "name" in script &&
        typeof script.name === "string" &&
        (!("author" in script) || typeof script.author === "string") &&
        (!("url" in script) || typeof script.url === "string") &&
        (!("description" in script) ||
            typeof script.description === "string") &&
        (!("version" in script) || typeof script.version === "string") &&
        "code" in script &&
        typeof script.code === "string" &&
        "parameters" in script &&
        Array.isArray(script.parameters) &&
        script.parameters.every(isScriptParameter)
    );
}
