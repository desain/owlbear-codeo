import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";
import { useCallback, useState } from "react";
import { POPOVER_ADD_BUTTON_ID } from "../constants";
import { buildScriptButton } from "../ScriptButton";
import { usePlayerStorage } from "../state/usePlayerStorage";

type ScriptOption = Readonly<{
    label: string;
    id: string;
}>;

export function AddButton({ position }: { position: Vector2 }) {
    const sensible = usePlayerStorage((store) => store.hasSensibleValues);
    const scripts = usePlayerStorage((store) => store.scripts);
    const handleClose = useCallback(() => {
        void OBR.popover.close(POPOVER_ADD_BUTTON_ID);
    }, []);
    const playerColor = usePlayerStorage((store) => store.playerColor);

    const [selectedScript, setSelectedScript] = useState<ScriptOption | null>(
        null,
    );

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
            <Autocomplete
                autoComplete
                autoHighlight
                autoSelect
                value={selectedScript}
                onChange={(_e, value) => setSelectedScript(value)}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                options={scripts.map((script) => ({
                    label: script.name,
                    id: script.id,
                }))}
                renderInput={(params) => (
                    <TextField {...params} label="Choose a script" />
                )}
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
