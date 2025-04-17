import { Close, Public, Save } from "@mui/icons-material";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { useCallback, useMemo, useState } from "react";
import { CodeoScript } from "../CodeoScript";
import { MODAL_EDIT_SCRIPT_ID } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";

interface EditScriptProps {
    /**
     * Script to edit. If null, this is a new script.
     */
    scriptId: string | null;
}

export function EditScript({ scriptId }: EditScriptProps) {
    const sensible = usePlayerStorage((store) => store.hasSensibleValues);
    const scripts = usePlayerStorage((store) => store.scripts);
    const script = useMemo(
        () => scripts.find((script) => script.id === scriptId),
        [scripts, scriptId],
    );
    const updateScript = usePlayerStorage((store) => store.updateScript);
    const addScript = usePlayerStorage((store) => store.addScript);
    const [formData, setFormData] = useState<Partial<CodeoScript>>(
        script ?? {
            name: "My New Script",
            description: "Describe your script here.",
            code: "OBR.notification.show('Hello world!')",
        },
    );

    const handleClose = useCallback(() => {
        void OBR.modal.close(MODAL_EDIT_SCRIPT_ID);
    }, []);

    if (!sensible) {
        return "Loading...";
    }

    const handleSave = () => {
        if (formData.name && formData.description && formData.code) {
            if (scriptId) {
                updateScript(scriptId, {
                    name: formData.name,
                    description: formData.description,
                    code: formData.code,
                });
            } else {
                addScript({
                    name: formData.name,
                    description: formData.description,
                    code: formData.code,
                });
            }
            handleClose();
        }
    };

    // Don't allow editing imported scripts
    const editingDisabled = script?.url !== undefined;

    return (
        <Dialog open fullWidth maxWidth="md">
            <DialogTitle>
                {editingDisabled
                    ? "View Script"
                    : scriptId
                    ? "Edit Script"
                    : "New Script"}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Name"
                        value={formData.name ?? ""}
                        fullWidth
                        disabled={editingDisabled}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />
                    <TextField
                        label="Description"
                        value={formData.description ?? ""}
                        fullWidth
                        multiline
                        rows={2}
                        variant="standard"
                        disabled={editingDisabled}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                    />
                    <CodeEditor
                        language="js"
                        placeholder="Enter your script here"
                        value={formData.code ?? ""}
                        padding={30}
                        disabled={editingDisabled}
                        style={{
                            fontFamily:
                                "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                            fontSize: 16,
                        }}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                code: e.target.value,
                            }))
                        }
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                {script?.url && (
                    <Button
                        href={script.url}
                        target="_blank"
                        startIcon={<Public />}
                    >
                        Open URL Source
                    </Button>
                )}
                <Button onClick={handleClose} startIcon={<Close />}>
                    {editingDisabled ? "Close" : "Cancel"}
                </Button>
                {!editingDisabled && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<Save />}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
