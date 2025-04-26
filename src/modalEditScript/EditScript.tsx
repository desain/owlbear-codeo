import {
    ArrowDownward,
    ArrowUpward,
    Close,
    Delete,
    Public,
    Save,
} from "@mui/icons-material";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { produce } from "immer";
import { useCallback, useMemo, useState } from "react";
import {
    CodeoScript,
    isParameterType,
    PARAMETER_TYPES,
    ScriptParameter,
} from "../CodeoScript";
import { MODAL_EDIT_SCRIPT_ID } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";

type EditScriptProps = Readonly<{
    /**
     * Script to edit. If null, this is a new script.
     */
    scriptId: string | null;
}>;

export function EditScript({ scriptId }: EditScriptProps) {
    const scripts = usePlayerStorage((store) => store.scripts);
    const playerName = usePlayerStorage((store) => store.playerName);
    const updateScript = usePlayerStorage((store) => store.updateScript);
    const addScript = usePlayerStorage((store) => store.addScript);
    const script = useMemo(
        () => scripts.find((script) => script.id === scriptId),
        [scripts, scriptId],
    );
    const [formData, setFormData] = useState<CodeoScript>(
        script ?? {
            name: "My New Script",
            description: "Describe your script here.",
            code: "OBR.notification.show('Hello world!')",
            parameters: [],
        },
    );

    const handleClose = useCallback(() => {
        void OBR.modal.close(MODAL_EDIT_SCRIPT_ID);
    }, []);

    const handleSave = () => {
        if (scriptId) {
            updateScript(scriptId, formData);
        } else {
            addScript({ author: playerName, ...formData });
        }
        handleClose();
    };

    const handleParamChange = <K extends keyof ScriptParameter>(
        idx: number,
        field: K,
        value: ScriptParameter[K],
    ) => {
        setFormData(
            produce((draft) => {
                draft.parameters[idx][field] = value;
            }),
        );
    };

    const handleAddParam = () => {
        setFormData(
            produce((draft) => {
                draft.parameters.push({
                    name: "",
                    description: "",
                    type: "string",
                });
            }),
        );
    };

    const handleDeleteParam = (idx: number) => {
        setFormData((prev) => ({
            ...prev,
            parameters: prev.parameters.filter((_, i) => i !== idx),
        }));
    };

    const handleMoveParam = (idx: number, direction: 1 | -1) => {
        setFormData(
            produce((draft) => {
                const newIdx = idx + direction;
                if (newIdx < 0 || newIdx >= draft.parameters.length) {
                    return;
                }
                [draft.parameters[idx], draft.parameters[newIdx]] = [
                    draft.parameters[newIdx],
                    draft.parameters[idx],
                ];
            }),
        );
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
                    {/* Parameter Editor */}
                    <Stack spacing={1}>
                        <Typography variant="subtitle1">Parameters</Typography>
                        {(formData.parameters ?? []).length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No parameters defined.
                            </Typography>
                        )}
                        {(formData.parameters ?? []).map((param, idx, arr) => (
                            <Stack
                                key={idx}
                                direction="row"
                                gap={1}
                                alignItems="center"
                                flexWrap={"wrap"}
                                sx={{ mb: 1 }}
                            >
                                <TextField
                                    label="Name"
                                    value={param.name}
                                    size="small"
                                    disabled={editingDisabled}
                                    onChange={(e) =>
                                        handleParamChange(
                                            idx,
                                            "name",
                                            e.target.value,
                                        )
                                    }
                                    sx={{ width: 120 }}
                                />
                                <TextField
                                    label="Description"
                                    value={param.description}
                                    size="small"
                                    disabled={editingDisabled}
                                    onChange={(e) =>
                                        handleParamChange(
                                            idx,
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    sx={{ flex: 1, minWidth: 120 }}
                                />
                                <TextField
                                    label="Type"
                                    select
                                    value={param.type}
                                    size="small"
                                    disabled={editingDisabled}
                                    onChange={(e) => {
                                        if (isParameterType(e.target.value)) {
                                            handleParamChange(
                                                idx,
                                                "type",
                                                e.target.value,
                                            );
                                        }
                                    }}
                                    sx={{ width: 110 }}
                                >
                                    {PARAMETER_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {!editingDisabled && (
                                    <>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleMoveParam(idx, -1)
                                            }
                                            disabled={idx === 0}
                                            aria-label="Move up"
                                        >
                                            <ArrowUpward fontSize="inherit" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleMoveParam(idx, 1)
                                            }
                                            disabled={idx === arr.length - 1}
                                            aria-label="Move down"
                                        >
                                            <ArrowDownward fontSize="inherit" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleDeleteParam(idx)
                                            }
                                            aria-label="Delete"
                                        >
                                            <Delete fontSize="inherit" />
                                        </IconButton>
                                    </>
                                )}
                            </Stack>
                        ))}
                        {!editingDisabled && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleAddParam}
                                sx={{ width: 180 }}
                            >
                                Add Parameter
                            </Button>
                        )}
                    </Stack>
                    <CodeEditor
                        language="js"
                        placeholder="Enter your script here"
                        value={formData.code ?? ""}
                        padding={30}
                        disabled={editingDisabled}
                        indentWidth={4}
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
