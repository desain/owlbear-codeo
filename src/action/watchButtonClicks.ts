import OBR from "@owlbear-rodeo/sdk";
import { METADATA_SCRIPT_ID_KEY } from "../constants";
import { runScript } from "../runScript";
import { isScriptButton } from "../ScriptButton";
import { usePlayerStorage } from "../state/usePlayerStorage";

export function startWatchingButtons() {
    return OBR.player.onChange(async (player) => {
        if (player.selection?.length !== 1) {
            return;
        }
        const [item] = await OBR.scene.items.getItems([player.selection[0]]);
        if (!isScriptButton(item)) {
            return;
        }
        void OBR.player.deselect();
        const script = usePlayerStorage
            .getState()
            .scripts.find(
                (script) => script.id === item.metadata[METADATA_SCRIPT_ID_KEY],
            );
        if (script === undefined) {
            void OBR.notification.show(
                `Script for ${item.text.plainText} not found`,
                "ERROR",
            );
            return;
        }
        runScript(script);
    });
}
