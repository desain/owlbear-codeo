import {
    Add,
    Delete,
    Edit,
    PlayCircleOutlineTwoTone,
    Public,
    Search,
    Stop,
    Update,
    Visibility,
} from "@mui/icons-material";
import {
    Box,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import OutlinedInput from "@mui/material/OutlinedInput";
import { HighlightRanges } from "@nozbe/microfuzz";
import { Highlight, useFuzzySearchList } from "@nozbe/microfuzz/react";
import OBR from "@owlbear-rodeo/sdk";
import { useActionResizer } from "owlbear-utils";
import { useRef, useState } from "react";
import { CodeoScript } from "../CodeoScript";
import { MODAL_EDIT_SCRIPT_ID, SCRIPT_ID_PARAM } from "../constants";
import { importScript } from "../importScript";
import { runScript } from "../runScript";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { useRehydrate } from "../state/useRehydrate";
import { DownloadScriptButton } from "./DownloadScriptButton";
import { ImportButton } from "./ImportButton";
import { ScriptUploadButton } from "./ScriptUploadButton";

const BASE_HEIGHT = 100;
const MAX_HEIGHT = 700;

async function openEditModal(scriptId?: string) {
    const queryString = scriptId ? `${SCRIPT_ID_PARAM}=${scriptId}` : "";
    await OBR.modal.open({
        id: MODAL_EDIT_SCRIPT_ID,
        url: `/src/modalEditScript/modalEditScript.html?${queryString}`,
        fullScreen: true,
        hideBackdrop: true,
        hidePaper: true,
    });
}

function ScriptCard({
    script,
    nameRanges,
    descriptionRanges,
}: {
    script: CodeoScript;
    nameRanges: HighlightRanges | null;
    descriptionRanges: HighlightRanges | null;
}) {
    const removeScript = usePlayerStorage((store) => store.removeScript);
    const updateScript = usePlayerStorage((store) => store.updateScript);
    const executions =
        usePlayerStorage((store) => store.executions.get(script.id)) ?? [];
    const stopExecution = usePlayerStorage((store) => store.stopExecution);

    const isImported = script.url !== undefined;

    return (
        <Card sx={{ width: "100%" }}>
            <CardHeader
                title={<Highlight text={script.name} ranges={nameRanges} />}
                slotProps={{
                    title: {
                        variant: "h6",
                    },
                }}
                // action={}
            />
            <CardContent>
                <Typography
                    color="text.secondary"
                    sx={{ wordBreak: "break-word" }}
                >
                    <Highlight
                        text={script.description || "[no description]"}
                        ranges={descriptionRanges}
                    />
                </Typography>
                {executions.length > 0 && (
                    <>
                        <Divider />
                        <Stack spacing={1} mt={2}>
                            {executions.map((execution) => (
                                <Stack
                                    key={execution.executionId}
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                >
                                    <Box
                                        sx={{
                                            position: "relative",
                                            display: "inline-flex",
                                        }}
                                    >
                                        <CircularProgress size={36} />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() =>
                                                stopExecution(
                                                    script.id,
                                                    execution.executionId,
                                                )
                                            }
                                            sx={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                transform:
                                                    "translate(-50%, -50%)",
                                                backgroundColor:
                                                    "background.paper",
                                                boxShadow: 1,
                                                "&:hover": {
                                                    backgroundColor:
                                                        "background.paper",
                                                },
                                            }}
                                        >
                                            <Stop fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {execution.executionName}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </>
                )}
            </CardContent>
            <CardActions>
                <Tooltip title="Run script">
                    <IconButton onClick={() => runScript(script)}>
                        <PlayCircleOutlineTwoTone />
                    </IconButton>
                </Tooltip>{" "}
                <Tooltip title={isImported ? "View" : "Edit script"}>
                    <IconButton onClick={() => void openEditModal(script.id)}>
                        {isImported ? <Visibility /> : <Edit />}
                    </IconButton>
                </Tooltip>
                <DownloadScriptButton script={script} />
                {script.url && (
                    <>
                        <Tooltip title="Fetch latest script">
                            <IconButton
                                onClick={async () => {
                                    if (!script.url) {
                                        return;
                                    }
                                    const updated = await importScript(
                                        script.url,
                                    );
                                    if (!updated) {
                                        return;
                                    }
                                    updateScript(script.id, updated);
                                    OBR.notification.show(
                                        "Updated script",
                                        "SUCCESS",
                                    );
                                }}
                            >
                                <Update />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Open source URL">
                            <IconButton href={script.url} target="_blank">
                                <Public />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
                <Tooltip title="Delete script">
                    <IconButton
                        color="error"
                        onClick={() => removeScript(script.id)}
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            </CardActions>
        </Card>
    );
}

export function Action() {
    const box: React.RefObject<HTMLElement | null> = useRef(null);
    const scripts = usePlayerStorage((store) => store.scripts);
    const addScript = usePlayerStorage((store) => store.addScript);

    useRehydrate();
    useActionResizer(BASE_HEIGHT, MAX_HEIGHT, box);

    const [search, setSearch] = useState("");
    // Fuzzy search on name, description, and code
    const filteredScripts = useFuzzySearchList({
        list: scripts,
        queryText: search,
        getText: (item) => [item.name, item.description],
        mapResultItem: ({
            item,
            matches: [nameRanges, descriptionRanges],
        }) => ({
            script: item,
            nameRanges,
            descriptionRanges,
        }),
    });

    return (
        <Box ref={box}>
            <Stack spacing={1}>
                <Stack direction={"row"} gap={1} alignItems={"center"}>
                    <CardHeader
                        title={"Owlbear Codeo"}
                        slotProps={{
                            title: {
                                sx: {
                                    fontSize: "1.125rem",
                                    fontWeight: "bold",
                                    lineHeight: "32px",
                                    color: "text.primary",
                                },
                            },
                        }}
                        sx={{ flex: 1 }}
                    />
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
                <Box px={2}>
                    <OutlinedInput
                        fullWidth
                        size="small"
                        placeholder="Search scripts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        startAdornment={
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        }
                    />
                </Box>
                <List>
                    {filteredScripts.map((scriptData) => (
                        <ListItem key={scriptData.script.id}>
                            <ScriptCard {...scriptData} />
                        </ListItem>
                    ))}
                </List>
            </Stack>
        </Box>
    );
}
