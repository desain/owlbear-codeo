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
} from "@owlbear-rodeo/sdk";
import { CodeoScript } from "./CodeoScript";

const AsyncFunction = async function () {}.constructor;
const TIMEOUT_MS = 1000;

export async function runScript(script: CodeoScript) {
    try {
        const scriptFunction = AsyncFunction(
            "OBR",
            "buildBillboard",
            "buildCurve",
            "buildEffect",
            "buildImage",
            "buildLabel",
            "buildLight",
            "buildLine",
            "buildPointer",
            "buildRuler",
            "buildShape",
            "buildText",
            "buildPath",
            "buildWall",
            "buildImageUpload",
            "buildSceneUpload",
            "'use strict';" + script.code,
        );
        await Promise.race([
            scriptFunction(
                OBR,
                buildBillboard,
                buildCurve,
                buildEffect,
                buildImage,
                buildLabel,
                buildLight,
                buildLine,
                buildPointer,
                buildRuler,
                buildShape,
                buildText,
                buildPath,
                buildWall,
                buildImageUpload,
                buildSceneUpload,
            ),
            new Promise((_resolve, reject) =>
                setTimeout(() => reject(new Error("Timed out")), TIMEOUT_MS),
            ),
        ]);
    } catch (error) {
        console.error(`Error running script "${script.name}":`, error);
        void OBR.notification.show(String(error), "ERROR");
    }
}
