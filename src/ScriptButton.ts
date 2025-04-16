import {
    buildLabel,
    buildShape,
    isLabel,
    Item,
    Label,
    Shape,
    Vector2,
} from "@owlbear-rodeo/sdk";
import { assertItem, HasParameterizedMetadata } from "owlbear-utils";
import { METADATA_SCRIPT_ID_KEY } from "./constants";

export type ScriptButton = Label &
    HasParameterizedMetadata<typeof METADATA_SCRIPT_ID_KEY, string>;
export function isScriptButton(item: Item): item is ScriptButton {
    return (
        isLabel(item) &&
        METADATA_SCRIPT_ID_KEY in item.metadata &&
        typeof item.metadata[METADATA_SCRIPT_ID_KEY] === "string"
    );
}

export function buildScriptButton(
    position: Vector2,
    color: string,
    text: string,
    scriptId: string,
): [Shape, ScriptButton] {
    const handle = buildShape()
        .shapeType("CIRCLE")
        .position(position)
        .width(50)
        .height(50)
        .strokeColor("#FFFFFF")
        .strokeOpacity(1)
        .strokeWidth(10)
        .fillColor(color)
        .fillOpacity(1)
        .layer("CONTROL")
        .visible(false)
        .build();
    const scriptButton = buildLabel()
        .position(position)
        .attachedTo(handle.id)
        .plainText(text)
        .metadata({ [METADATA_SCRIPT_ID_KEY]: scriptId })
        .locked(true)
        .maxViewScale(4)
        .minViewScale(4)
        .pointerHeight(0)
        .visible(false)
        .build();
    assertItem(scriptButton, isScriptButton);
    return [handle, scriptButton];
}
