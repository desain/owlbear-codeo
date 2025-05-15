import OBR from "@owlbear-rodeo/sdk";
import { broadcast } from "../broadcast/handleBroadcast";
import {
    METADATA_EXECUTION_ID_KEY,
    METADATA_SCRIPT_ID_KEY,
} from "../constants";
import { runScript } from "../script/runScript";
import { BACKGROUND_ON, isScriptButton } from "../ScriptButton";
import { usePlayerStorage } from "../state/usePlayerStorage";

export function startWatchingButtons() {
    return OBR.player.onChange(async (player) => {
        if (!player.selection?.[0] || player.selection.length !== 1) {
            return;
        }
        const [item] = await OBR.scene.items.getItems([player.selection[0]]);
        if (!item || !isScriptButton(item)) {
            return;
        }
        void OBR.player.deselect();

        const scriptId = item.metadata[METADATA_SCRIPT_ID_KEY];
        const executionId = item.metadata[METADATA_EXECUTION_ID_KEY];
        if (executionId) {
            await broadcast({
                type: "STOP_EXECUTION",
                id: scriptId,
                executionId,
            });
        } else {
            const script = usePlayerStorage.getState().getScriptById(scriptId);
            if (!script) {
                void OBR.notification.show(
                    `Script for button '${item.text.plainText}' not found`,
                    "ERROR",
                );
                return;
            }
            const newExecutionId = await runScript(script[0]);
            if (newExecutionId) {
                await OBR.scene.items.updateItems([item], (items) =>
                    items.forEach((item) => {
                        item.style.backgroundColor = BACKGROUND_ON;
                        item.metadata[METADATA_EXECUTION_ID_KEY] =
                            newExecutionId;
                    }),
                );
            }
        }
    });
}
