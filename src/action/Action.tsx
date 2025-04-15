import { Add, Delete, Edit } from "@mui/icons-material";
import {
    Box,
    Card,
    CardActions,
    CardContent,
    IconButton,
    List,
    ListItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useActionResizer } from "owlbear-utils";
import { useRef } from "react";
import { MODAL_ID, SCRIPT_ID_PARAM } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { useRehydrate } from "../state/useRehydrate";
import { DownloadScriptButton } from "./DownloadScriptButton";
import { ImportButton } from "./ImportButton";
import { RunScriptButton } from "./RunScriptButton";
import { ScriptUploadButton } from "./ScriptUploadButton";

const BASE_HEIGHT = 100;
const MAX_HEIGHT = 700;

async function openEditModal(scriptId?: string) {
    const queryString = scriptId ? `${SCRIPT_ID_PARAM}=${scriptId}` : "";
    await OBR.modal.open({
        id: MODAL_ID,
        url: `/modal.html?${queryString}`,
        fullScreen: true,
        hideBackdrop: true,
        hidePaper: true,
    });
}

export function Action() {
    const box: React.RefObject<HTMLElement | null> = useRef(null);
    const scripts = usePlayerStorage((store) => store.scripts);
    const addScript = usePlayerStorage((store) => store.addScript);
    const removeScript = usePlayerStorage((store) => store.removeScript);

    useRehydrate();
    useActionResizer(BASE_HEIGHT, MAX_HEIGHT, box);

    return (
        <Box ref={box}>
            <Stack spacing={2}>
                <Stack direction={"row"} gap={1} alignItems={"center"}>
                    <Typography variant="h6" sx={{ flex: 1 }}>
                        Owlbear Codeo
                    </Typography>
                    <Tooltip title="Create new script">
                        <IconButton
                            color="primary"
                            onClick={() => openEditModal()}
                        >
                            <Add />
                        </IconButton>
                    </Tooltip>
                    <ImportButton addScript={addScript} />
                    <ScriptUploadButton
                        onReceiveScript={(script) => {
                            const { id, createdAt, updatedAt, ...scriptData } =
                                script;
                            addScript(scriptData);
                        }}
                    />
                </Stack>

                <List>
                    {scripts.map((script) => (
                        <ListItem key={script.id}>
                            <Card sx={{ width: "100%" }}>
                                <CardContent>
                                    <Typography variant="h6" component="h2">
                                        {script.name}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ wordBreak: "break-word" }}
                                    >
                                        {script.description}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <RunScriptButton script={script} />
                                    <Tooltip title="Edit script">
                                        <IconButton
                                            color="primary"
                                            onClick={() =>
                                                void openEditModal(script.id)
                                            }
                                        >
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <DownloadScriptButton script={script} />
                                    <Tooltip title="Delete script">
                                        <IconButton
                                            color="error"
                                            onClick={() =>
                                                removeScript(script.id)
                                            }
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </ListItem>
                    ))}
                </List>
            </Stack>
        </Box>
    );
}
