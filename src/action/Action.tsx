import { Add, Delete, Edit } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import { Highlight, useFuzzySearchList } from "@nozbe/microfuzz/react";
import OBR from "@owlbear-rodeo/sdk";
import { useActionResizer } from "owlbear-utils";
import { useRef, useState } from "react";
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
            item,
            nameRanges,
            descriptionRanges,
        }),
    });

    return (
        <Box ref={box}>
            <Stack spacing={2}>
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
                                <SearchIcon />
                            </InputAdornment>
                        }
                    />
                </Box>
                <List>
                    {filteredScripts.map(
                        ({ item: script, nameRanges, descriptionRanges }) => (
                            <ListItem key={script.id}>
                                <Card sx={{ width: "100%" }}>
                                    <CardHeader
                                        title={
                                            <Highlight
                                                text={script.name}
                                                ranges={nameRanges}
                                            />
                                        }
                                        slotProps={{
                                            title: {
                                                variant: "h6",
                                            },
                                        }}
                                        action={
                                            <RunScriptButton script={script} />
                                        }
                                    />
                                    <CardContent>
                                        <Typography
                                            color="text.secondary"
                                            sx={{ wordBreak: "break-word" }}
                                        >
                                            <Highlight
                                                text={script.description}
                                                ranges={descriptionRanges}
                                            />
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Tooltip title="Edit script">
                                            <IconButton
                                                color="primary"
                                                onClick={() =>
                                                    void openEditModal(
                                                        script.id,
                                                    )
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
                        ),
                    )}
                </List>
            </Stack>
        </Box>
    );
}
