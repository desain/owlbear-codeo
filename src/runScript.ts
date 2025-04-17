import OBR, {
    buildBillboard,
    buildCurve,
    buildEffect,
    buildImage,
    buildImageUpload,
    buildLabel,
    buildLight,
    buildLine,
    buildPath,
    buildPointer,
    buildRuler,
    buildSceneUpload,
    buildShape,
    buildText,
    buildWall,
    isBillboard,
    isCurve,
    isEffect,
    isImage,
    isLabel,
    isLight,
    isLine,
    isPath,
    isPointer,
    isRuler,
    isShape,
    isText,
    isWall,
    Math2,
    MathM,
} from "@owlbear-rodeo/sdk";
import { makeCodeo, saveExecution } from "./Codeo";
import { ScriptParameter } from "./CodeoScript";
import { Execution, isNewExecution } from "./Execution";
import {
    ParameterWithValue,
    StoredScript,
    usePlayerStorage,
} from "./state/usePlayerStorage";

function getExecution(response: unknown): Execution | null {
    if (isNewExecution(response)) {
        return {
            stop: response.stop,
            executionName: response.executionName,
            executionId: crypto.randomUUID(),
        };
    } else if (typeof response === "function") {
        return {
            stop: response as VoidFunction,
            executionName: "Running",
            executionId: crypto.randomUUID(),
        };
    } else {
        return null;
    }
}

const AsyncFunction = async function () {}.constructor;
const TIMEOUT_MS = 1000;

/**
 * Run a script.
 * @param script The script to run.
 * @returns The execution ID of the script, or null if the script did not return an execution.
 */
export async function runScript(script: StoredScript): Promise<string | null> {
    try {
        const scriptFunction = AsyncFunction(
            "Codeo",
            "OBR",
            "Math2",
            "MathM",
            "buildBillboard",
            "isBillboard",
            "buildCurve",
            "isCurve",
            "buildEffect",
            "isEffect",
            "buildImage",
            "isImage",
            "buildLabel",
            "isLabel",
            "buildLight",
            "isLight",
            "buildLine",
            "isLine",
            "buildPointer",
            "isPointer",
            "buildRuler",
            "isRuler",
            "buildShape",
            "isShape",
            "buildText",
            "isText",
            "buildPath",
            "isPath",
            "buildWall",
            "isWall",
            "buildImageUpload",
            "buildSceneUpload",
            ...script.parameters.map((parameter) => parameter.name),
            "'use strict';" + script.code,
        );
        const codeo = makeCodeo(script.id);
        const response: unknown = await Promise.race([
            scriptFunction(
                codeo,
                OBR,
                Math2,
                MathM,
                buildBillboard,
                isBillboard,
                buildCurve,
                isCurve,
                buildEffect,
                isEffect,
                buildImage,
                isImage,
                buildLabel,
                isLabel,
                buildLight,
                isLight,
                buildLine,
                isLine,
                buildPointer,
                isPointer,
                buildRuler,
                isRuler,
                buildShape,
                isShape,
                buildText,
                isText,
                buildPath,
                isPath,
                buildWall,
                isWall,
                buildImageUpload,
                buildSceneUpload,
                ...script.parameters.map(
                    (parameter: ScriptParameter & ParameterWithValue) =>
                        parameter.value,
                ),
            ),
            new Promise((_resolve, reject) =>
                setTimeout(() => reject(new Error("Timed out")), TIMEOUT_MS),
            ),
        ]);
        const execution = getExecution(response);
        if (execution !== null) {
            saveExecution(codeo, execution.executionId);
            usePlayerStorage.getState().addExecution(script.id, execution);
            return execution.executionId;
        }
    } catch (error) {
        console.error(`Error running script "${script.name}":`, error);
        void OBR.notification.show(String(error), "ERROR");
    }
    return null;
}
