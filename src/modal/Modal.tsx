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
import { useCallback, useEffect, useState } from "react";
import { CodeoScript } from "../CodeoScript";
import { MODAL_ID } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";

interface ModalProps {
    /**
     * Script to edit. If null, this is a new script.
     */
    scriptId: string | null;
}

export function Modal({ scriptId }: ModalProps) {
    const sensible = usePlayerStorage((store) => store.hasSensibleValues);
    const scripts = usePlayerStorage((store) => store.scripts);
    const updateScript = usePlayerStorage((store) => store.updateScript);
    const addScript = usePlayerStorage((store) => store.addScript);
    const [formData, setFormData] = useState<Partial<CodeoScript>>({});

    const handleClose = useCallback(() => {
        void OBR.modal.close(MODAL_ID);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClose]);

    useEffect(() => {
        const script = scripts.find((s) => s.id === scriptId);
        if (script) {
            setFormData({
                name: script.name,
                description: script.description,
                code: script.code,
            });
        } else {
            setFormData({
                name: "My New Script",
                description: "Describe your script here.",
                code: "OBR.notification.show('Hello world!')",
            });
        }
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

    return (
        <Dialog open fullWidth maxWidth="md">
            <DialogTitle>{scriptId ? "Edit Script" : "New Script"}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Name"
                        value={formData.name ?? ""}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        fullWidth
                    />
                    <TextField
                        label="Description"
                        value={formData.description ?? ""}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                        fullWidth
                        multiline
                        rows={2}
                        variant="standard"
                    />
                    <CodeEditor
                        language="js"
                        placeholder="Enter your script here"
                        value={formData.code ?? ""}
                        padding={30}
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
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
