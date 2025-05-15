import type { Item } from "@owlbear-rodeo/sdk";
import { isCodeoScript, type CodeoScript } from "../script/CodeoScript";

/*
Values here must be readonly to avoid a Typescript issue
If values can be written, then this compiles:

const x: ParameterWithValue =
    Math.random() > 0.5
        ? { type: "string", value: "x" }
        : { type: "number", value: 0 };

x.value = 100;

But it might result in a runtime state where x = {
    type: "string",
    value: 100,
}

This is apparently not considered a typescript bug, but
I think it should be.

Making the values readonly avoids this.
*/
interface BooleanParameter {
    readonly type: "boolean";
    readonly value?: boolean;
}
interface NumberParameter {
    readonly type: "number";
    readonly value?: number;
}
interface StringParameter {
    readonly type: "string";
    readonly value?: string;
}
interface ItemParameter {
    readonly type: "Item";
    readonly value?: Item;
}

export type ParameterWithValue =
    | BooleanParameter
    | NumberParameter
    | StringParameter
    | ItemParameter;

export type StoredScript = CodeoScript & {
    id: string;
    createdAt: number;
    updatedAt: number;
    runAt: number;
    parameters: ParameterWithValue[];
};
export function isStoredScript(
    storedScript: unknown,
): storedScript is StoredScript {
    return (
        isCodeoScript(storedScript) &&
        "id" in storedScript &&
        typeof storedScript.id === "string" &&
        "createdAt" in storedScript &&
        typeof storedScript.createdAt === "number" &&
        "updatedAt" in storedScript &&
        typeof storedScript.updatedAt === "number" &&
        "runAt" in storedScript &&
        typeof storedScript.runAt === "number" &&
        "parameters" in storedScript &&
        Array.isArray(storedScript.parameters) &&
        true // TODO: check each parameter
    );
}
