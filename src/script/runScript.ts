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
import { Codeo } from "../Codeo";
import type { Execution } from "../Execution";
import { isNewExecution } from "../Execution";
import type { ParameterWithValue, StoredScript } from "../state/StoredScript";
import { usePlayerStorage } from "../state/usePlayerStorage";
import type { ScriptParameter } from "./CodeoScript";

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

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
const AsyncFunction = async function () {
    // no content since we're just getting the constructor
}.constructor;
const TIMEOUT_MS = 1000;

type ScriptFunction = (
    codeo: Codeo,
    obr: typeof OBR,
    math2: typeof Math2,
    mathM: typeof MathM,
    _buildBillboard: typeof buildBillboard,
    _isBillboard: typeof isBillboard,
    _buildCurve: typeof buildCurve,
    _isCurve: typeof isCurve,
    _buildEffect: typeof buildEffect,
    _isEffect: typeof isEffect,
    _buildImage: typeof buildImage,
    _isImage: typeof isImage,
    _buildLabel: typeof buildLabel,
    _isLabel: typeof isLabel,
    _buildLight: typeof buildLight,
    _isLight: typeof isLight,
    _buildLine: typeof buildLine,
    _isLine: typeof isLine,
    _buildPointer: typeof buildPointer,
    _isPointer: typeof isPointer,
    _buildRuler: typeof buildRuler,
    _isRuler: typeof isRuler,
    _buildShape: typeof buildShape,
    _isShape: typeof isShape,
    _buildText: typeof buildText,
    _isText: typeof isText,
    _buildPath: typeof buildPath,
    _isPath: typeof isPath,
    _buildWall: typeof buildWall,
    _isWall: typeof isWall,
    _buildImageUpload: typeof buildImageUpload,
    _buildSceneUpload: typeof buildSceneUpload,
    ...args: ParameterWithValue["value"][]
) => unknown;

/**
 * Run a script.
 * @param script The script to run.
 * @returns The execution ID of the script, or null if the script did not return an execution.
 */
export async function runScript(script: StoredScript): Promise<string | null> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const scriptFunction: ScriptFunction = AsyncFunction(
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
        const codeo = new Codeo(script.id);
        const response = await Promise.race([
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
        usePlayerStorage.getState().markScriptRun(script.id);
        const execution = getExecution(response);
        if (execution !== null) {
            codeo.saveExecution(execution.executionId);
            usePlayerStorage.getState().addExecution(script.id, execution);
            return execution.executionId;
        }
    } catch (error) {
        console.error(`Error running script "${script.name}":`, error);
        void OBR.notification.show(`${script.name}: ${String(error)}`, "ERROR");
    }
    return null;
}
