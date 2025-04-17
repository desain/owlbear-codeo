import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { useCallback, useState } from "react";
import { POPOVER_ADD_BUTTON_ID } from "../constants";
import { buildScriptButton } from "../ScriptButton";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { ScriptPicker, ScriptPickerOption } from "../ui/ScriptPicker";

export function AddButton({ position }: { position: Vector2 }) {
    const sensible = usePlayerStorage((store) => store.hasSensibleValues);
    const scripts = usePlayerStorage((store) => store.scripts);
    const handleClose = useCallback(() => {
        void OBR.popover.close(POPOVER_ADD_BUTTON_ID);
    }, []);
    const playerColor = usePlayerStorage((store) => store.playerColor);

    const [selectedScript, setSelectedScript] =
        useState<ScriptPickerOption | null>(null);

    const handleAdd = async () => {
        if (selectedScript === null) {
            return;
        }
        await Promise.all([
            OBR.player.deselect(),
            OBR.scene.items.addItems(
                buildScriptButton(
                    Math2.add(position, { x: 0, y: 40 }),
                    playerColor,
                    selectedScript.label,
                    selectedScript.id,
                ),
            ),
        ]);
        handleClose();
    };

    if (!sensible) {
        return null;
    }

    return (
        <Stack sx={{ p: 2 }} gap={2}>
            <Typography variant="h6">New Script Button</Typography>
            <ScriptPicker
                scripts={scripts}
                value={selectedScript}
                onChange={setSelectedScript}
            />
            <Stack direction={"row"} gap={1} justifyContent={"end"}>
                <Button onClick={handleClose} startIcon={<CloseIcon />}>
                    Cancel
                </Button>
                <Button
                    onClick={handleAdd}
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={selectedScript === null}
                >
                    Add
                </Button>
            </Stack>
        </Stack>
    );
}
