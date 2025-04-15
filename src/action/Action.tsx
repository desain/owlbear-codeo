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
import { useActionResizer } from "owlbear-utils";
import { useRef } from "react";
import { usePlayerSettings } from "../state/useLocalStorage";
import { DownloadScriptButton } from "./DownloadScriptButton";
import { RunScriptButton } from "./RunScriptButton";
import { ScriptUploadButton } from "./ScriptUploadButton";

export function Action() {
    const box: React.RefObject<HTMLElement | null> = useRef(null);
    const { scripts, addScript, removeScript } = usePlayerSettings();

    const BASE_HEIGHT = 100;
    const MAX_HEIGHT = 700;
    useActionResizer(BASE_HEIGHT, MAX_HEIGHT, box);

    const handleAddScript = () => {
        addScript({
            name: "New Script",
            description: "A new custom script",
            code: "// Write your script here",
            enabled: true,
        });
    };

    return (
        <Box ref={box}>
            <Stack spacing={2}>
                <Stack direction={"row"} gap={1} alignItems={"center"}>
                    <Typography variant="h6" sx={{ flex: 1 }}>
                        Owlbear Codeo
                    </Typography>
                    <Tooltip title="Create new script">
                        <IconButton color="primary" onClick={handleAddScript}>
                            <Add />
                        </IconButton>
                    </Tooltip>
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
                                    <Typography color="text.secondary">
                                        {script.description}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <RunScriptButton script={script} />
                                    <Tooltip title="Edit script">
                                        <IconButton color="primary">
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
