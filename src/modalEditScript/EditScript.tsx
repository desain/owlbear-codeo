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
import { useCallback, useEffect, useState } from "react";
import { MODAL_EDIT_SCRIPT_ID } from "../constants";
import type { CodeoScript, ScriptParameter } from "../script/CodeoScript";
import { isParameterType, PARAMETER_TYPES } from "../script/CodeoScript";
import {
    ScriptContainerUtils,
    withLocalAndRemoteContainers,
} from "../state/ScriptContainerUtils";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { useSelectedScript } from "../useSelectedScript";
import { canEditScript } from "../utils/utils";

type EditScriptProps = Readonly<{
    /**
     * Script to edit. If null, this is a new script.
     */
    scriptId: string | undefined;
}>;

export function EditScript({ scriptId }: EditScriptProps) {
    const role = usePlayerStorage((store) => store.role);
    const playerName = usePlayerStorage((store) => store.playerName);
    const addLocalScript = usePlayerStorage((store) => store.addLocalScript);
    const script = useSelectedScript(scriptId);
    const [formData, setFormData] = useState<CodeoScript>(
        script?.[0] ?? {
            name: "My New Script",
            description: "Describe your script here.",
            code: "OBR.notification.show('Hello world!')",
            parameters: [],
        },
    );

    const handleClose = useCallback(() => {
        void OBR.modal.close(MODAL_EDIT_SCRIPT_ID);
    }, []);

    const handleSave = useCallback(async () => {
        if (scriptId) {
            await withLocalAndRemoteContainers((container) => {
                ScriptContainerUtils.update(container, scriptId, formData);
            });
        } else {
            addLocalScript({ author: playerName, ...formData });
        }
        handleClose();
    }, [scriptId, handleClose, formData, addLocalScript, playerName]);

    // Don't allow editing imported scripts
    const isImported = !!script?.[0].url;
    // Treat new scripts as local
    const isLocal = script?.[1] ?? true;
    const editingDisabled = isImported || !canEditScript(role, isLocal);

    // Save on Ctrl+S or Cmd+S
    useEffect(() => {
        if (editingDisabled) {
            return;
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                void handleSave();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editingDisabled, handleSave]);

    const handleParamChange = <K extends keyof ScriptParameter>(
        idx: number,
        field: K,
        value: ScriptParameter[K],
    ) => {
        setFormData(
            produce((draft) => {
                const param = draft.parameters[idx];
                if (param) {
                    param[field] = value;
                }
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
                const [p1, p2] = [
                    draft.parameters[idx],
                    draft.parameters[newIdx],
                ];
                if (p1 && p2) {
                    [draft.parameters[idx], draft.parameters[newIdx]] = [
                        p2,
                        p1,
                    ];
                } else {
                    // invalid indices
                    return;
                }
            }),
        );
    };

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
                {script?.[0].url && (
                    <Button
                        href={script?.[0].url}
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
