import OBR from "@owlbear-rodeo/sdk";
import logo from "../../assets/logo.svg";
import {
    CREATE_BUTTON_CONTEXTMENU_ID,
    POPOVER_ADD_BUTTON_ID,
} from "../constants";

export async function installContextMenu() {
    await OBR.contextMenu.create({
        id: CREATE_BUTTON_CONTEXTMENU_ID,
        icons: [
            {
                icon: logo,
                label: "Create Script Button",
                filter: {
                    min: 0,
                    max: 0,
                    roles: ["GM"],
                },
            },
        ],
        onClick: (context, elementId) => {
            const x = context.selectionBounds.center.x;
            const y = context.selectionBounds.center.y;
            return OBR.popover.open({
                id: POPOVER_ADD_BUTTON_ID,
                url: `/src/popoverAddButton/popoverAddButton.html?x=${x}&y=${y}`,
                anchorElementId: elementId,
                width: 300,
                height: 200,
            });
        },
    });
}
