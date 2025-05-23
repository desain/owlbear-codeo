import {
    AccessTime,
    Add,
    ArrowDownward,
    ArrowUpward,
    Delete,
    Edit,
    FileCopy,
    MoreVert,
    Person,
    PlayCircleOutlineTwoTone,
    Search,
    Settings,
    Share,
    Sort,
    SortByAlpha,
    Stop,
    Update,
    Visibility,
} from "@mui/icons-material";
import {
    Avatar,
    Box,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Checkbox,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    Link,
    List,
    ListItem,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import type { HighlightRanges } from "@nozbe/microfuzz";
import { Highlight, useFuzzySearchList } from "@nozbe/microfuzz/react";
import OBR, { isImage } from "@owlbear-rodeo/sdk";
import { getName, useActionResizer, useRehydrate } from "owlbear-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { broadcast } from "../broadcast/handleBroadcast";
import {
    MODAL_EDIT_SCRIPT_ID,
    POPOVER_SETTINGS_ID,
    SCRIPT_ID_PARAM,
} from "../constants";
import type { Execution } from "../Execution";
import type { ScriptParameter } from "../script/CodeoScript";
import { deleteScript } from "../script/deleteScript";
import { runScript } from "../script/runScript";
import { updateRoomMetadata } from "../state/RoomMetadata";
import {
    ScriptContainerUtils,
    withLocalAndRemoteContainers,
} from "../state/ScriptContainerUtils";
import type { ParameterWithValue, StoredScript } from "../state/StoredScript";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { canEditScript } from "../utils/utils";
import { DownloadScriptButton } from "./DownloadScriptButton";
import { ImportButton } from "./ImportButton";
import { RefreshScriptButton } from "./RefreshScriptButton";
import { UploadScriptButton } from "./UploadScriptButton";

const BASE_HEIGHT = 100;
const MAX_HEIGHT = 700;

async function openSettingsPopover() {
    await OBR.popover.open({
        id: POPOVER_SETTINGS_ID,
        url: `/src/popoverSettings/popoverSettings.html`,
        width: 400,
        height: 600,
    });
}

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

function ExecutionItem({
    script,
    execution,
}: {
    script: StoredScript;
    execution: Execution;
}) {
    return (
        <Stack direction="row" alignItems="center" spacing={2}>
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
                        broadcast({
                            type: "STOP_EXECUTION",
                            id: script.id,
                            executionId: execution.executionId,
                        })
                    }
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "background.paper",
                        boxShadow: 1,
                    }}
                >
                    <Stop />
                </IconButton>
            </Box>
            <Typography variant="body2" color="textSecondary">
                {execution.executionName}
            </Typography>
        </Stack>
    );
}

function OverflowMenu({
    local,
    script,
}: {
    local: boolean;
    script: StoredScript;
}) {
    const isGm = usePlayerStorage((store) => store.role) === "GM";
    const playerName = usePlayerStorage((store) => store.playerName);
    const addLocalScript = usePlayerStorage((store) => store.addLocalScript);
    const getScriptById = usePlayerStorage((store) => store.getScriptById);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleShare = async (scriptId: string) => {
        const script = getScriptById(scriptId);
        if (!script?.[1]) {
            console.warn("Attempt to share nonexistent local script");
            return;
        }
        // Add it to the room
        // The update logic will take care of deleting the local copy
        await updateRoomMetadata((roomMetadata) => {
            ScriptContainerUtils.addStored(roomMetadata, script[0]);
        });
    };

    const handleUnshare = async (scriptId: string) => {
        const script = getScriptById(scriptId);
        if (!script || script[1]) {
            console.warn("Attempt to unshare nonexistent room script");
            return;
        }
        // Remove from the room
        await deleteScript(scriptId);
        // Add locally
        addLocalScript(script[0]);
    };

    return (
        <>
            <Tooltip title="More">
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <MoreVert />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem
                    onClick={() => {
                        addLocalScript({
                            name: script.name + " (copy)",
                            author: playerName,
                            description: script.description,
                            code: script.code,
                            parameters: script.parameters,
                        });
                        setAnchorEl(null);
                    }}
                >
                    <ListItemIcon>
                        <FileCopy />
                    </ListItemIcon>
                    Copy to New
                </MenuItem>
                {(local || isGm) && (
                    <MenuItem onClick={() => deleteScript(script.id)}>
                        <ListItemIcon>
                            <Delete />
                        </ListItemIcon>
                        Delete
                    </MenuItem>
                )}
                {isGm && local && (
                    <MenuItem onClick={() => handleShare(script.id)}>
                        <ListItemIcon>
                            <Share />
                        </ListItemIcon>
                        Share with Room
                    </MenuItem>
                )}
                {isGm && !local && (
                    <MenuItem onClick={() => handleUnshare(script.id)}>
                        <ListItemIcon>
                            <Share color="primary" />
                        </ListItemIcon>
                        Stop Sharing
                    </MenuItem>
                )}
            </Menu>
        </>
    );
}

export function Parameter({
    editingDisabled,
    script,
    param,
    idx,
}: {
    editingDisabled: boolean;
    script: StoredScript;
    param: ScriptParameter & ParameterWithValue;
    idx: number;
}) {
    const handleSetParameterValue = (value: ParameterWithValue["value"]) =>
        withLocalAndRemoteContainers((container) => {
            ScriptContainerUtils.setParameterValue(
                container,
                script.id,
                idx,
                value,
            );
        });

    return (
        <Stack direction="row" alignItems="center" spacing={2}>
            <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ minWidth: 120 }}
            >
                {param.description}
            </Typography>
            {param.type === "boolean" ? (
                <Checkbox
                    disabled={editingDisabled}
                    checked={!!param.value}
                    onChange={(_, checked) => handleSetParameterValue(checked)}
                />
            ) : param.type === "Item" ? (
                <Chip
                    disabled={editingDisabled}
                    avatar={
                        param.value && isImage(param.value) ? (
                            <Avatar src={param.value.image.url} />
                        ) : undefined
                    }
                    label={
                        param.value ? getName(param.value) : "Take Selection"
                    }
                    onClick={async () => {
                        if (param.value) {
                            void OBR.player.select([param.value.id]); // Added void
                        } else {
                            const [selected] =
                                (await OBR.player.getSelection()) ?? [];
                            if (!selected) {
                                void OBR.notification.show( // Added void
                                    "No items selected",
                                    "ERROR",
                                );
                                return;
                            }
                            const [item] = await OBR.scene.items.getItems([
                                selected,
                            ]);
                            if (item) {
                                await handleSetParameterValue(item);
                            }
                        }
                    }}
                    onDelete={
                        param.value &&
                        (() => handleSetParameterValue(undefined))
                    }
                />
            ) : param.type === "ItemList" ? (
                <Chip
                    disabled={editingDisabled}
                    label={
                        param.value && Array.isArray(param.value) && param.value.length > 0
                            ? `${param.value.length} item(s) selected`
                            : "Set Multi-Selection"
                    }
                    onClick={async () => {
                        const selectedIds = await OBR.player.getSelection();
                        if (!selectedIds || selectedIds.length === 0) {
                            void OBR.notification.show("No items selected", "INFO"); // Added void
                            // Optionally, if you want to clear the value if nothing is selected:
                            // await handleSetParameterValue(undefined); 
                            return;
                        }
                        const items = await OBR.scene.items.getItems(selectedIds);
                        if (items.length > 0) {
                            await handleSetParameterValue(items);
                        } else {
                            // This case might happen if selected IDs are no longer valid
                            void OBR.notification.show( // Added void
                                "Could not retrieve selected items.",
                                "WARNING"
                            );
                            await handleSetParameterValue(undefined);
                        }
                    }}
                    onDelete={
                        param.value && Array.isArray(param.value) && param.value.length > 0
                            ? () => handleSetParameterValue(undefined)
                            : undefined
                    }
                />
            ) : (
                <TextField
                    disabled={editingDisabled}
                    type={param.type === "number" ? "number" : "text"}
                    size="small"
                    value={param.value ?? ""}
                    onChange={(e) => {
                        const val =
                            param.type === "number"
                                ? Number(e.target.value)
                                : e.target.value;
                        return handleSetParameterValue(val);
                    }}
                    // sx={{ minWidth: 120 }}
                />
            )}
        </Stack>
    );
}

function ScriptCard({
    local,
    script,
    nameRanges,
    descriptionRanges,
    authorRanges,
}: {
    local: boolean;
    script: StoredScript;
    nameRanges: HighlightRanges | null;
    descriptionRanges: HighlightRanges | null;
    authorRanges: HighlightRanges | null;
}) {
    const executions =
        usePlayerStorage((store) => store.executions.get(script.id)) ?? [];
    const role = usePlayerStorage((store) => store.role);

    const hasUrl = script.url !== undefined;
    const editingDisabled = !canEditScript(role, local);

    return (
        <Card sx={{ width: "100%" }}>
            <CardHeader
                title={
                    <Stack direction="row" alignItems="center" gap={1}>
                        {!local && <Share color="disabled" />}
                        <Box>
                            <Highlight text={script.name} ranges={nameRanges} />
                        </Box>
                        {script.version && (
                            <Typography color="textSecondary">
                                v{script.version}
                            </Typography>
                        )}
                    </Stack>
                }
                subheader={
                    script.author && (
                        <Highlight
                            text={script.author ?? ""}
                            ranges={authorRanges}
                        />
                    )
                }
                slotProps={{
                    title: {
                        variant: "h6",
                    },
                }}
                action={<OverflowMenu local={local} script={script} />}
            />
            <CardContent>
                {script.description && (
                    <Typography
                        color="textSecondary"
                        sx={{ wordBreak: "break-word" }}
                    >
                        <Highlight
                            text={script.description}
                            ranges={descriptionRanges}
                        />
                    </Typography>
                )}
                {/* Parameters UI */}
                {script.parameters.length > 0 && (
                    <Stack spacing={2} mt={2} mb={2}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Parameters
                        </Typography>
                        {script.parameters.map((param, idx) => (
                            <Parameter
                                editingDisabled={editingDisabled}
                                key={idx}
                                script={script}
                                param={param}
                                idx={idx}
                            />
                        ))}
                    </Stack>
                )}
                {/* Executions UI */}
                {executions.length > 0 && (
                    <>
                        <Divider />
                        <Stack spacing={1} mt={2}>
                            {executions.map((execution) => (
                                <ExecutionItem
                                    key={execution.executionId}
                                    script={script}
                                    execution={execution}
                                />
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
                </Tooltip>
                <Tooltip title={hasUrl ? "View" : "Edit script"}>
                    <IconButton onClick={() => void openEditModal(script.id)}>
                        {!hasUrl && !editingDisabled ? (
                            <Edit />
                        ) : (
                            <Visibility />
                        )}
                    </IconButton>
                </Tooltip>
                <DownloadScriptButton script={script} />
                {script.url && (
                    <RefreshScriptButton
                        disabled={editingDisabled}
                        script={script}
                    />
                )}
            </CardActions>
        </Card>
    );
}

type SortOption =
    | "name-asc"
    | "name-desc"
    | "created-desc"
    | "created-asc"
    | "updated-desc"
    | "updated-asc"
    | "author-asc"
    | "author-desc"
    | "run-asc"
    | "run-desc";

function getComparator(
    sortOption: SortOption,
): (a: { script: StoredScript }, b: { script: StoredScript }) => number {
    switch (sortOption) {
        case "name-asc":
            return (a, b) =>
                a.script.name.localeCompare(b.script.name, undefined, {
                    sensitivity: "base",
                });
        case "name-desc":
            return (a, b) =>
                b.script.name.localeCompare(a.script.name, undefined, {
                    sensitivity: "base",
                });
        case "created-asc":
            return (a, b) => a.script.createdAt - b.script.createdAt;
        case "created-desc":
            return (a, b) => b.script.createdAt - a.script.createdAt;
        case "updated-asc":
            return (a, b) => a.script.updatedAt - b.script.updatedAt;
        case "updated-desc":
            return (a, b) => b.script.updatedAt - a.script.updatedAt;
        case "author-asc":
            return (a, b) =>
                (a.script.author ?? "").localeCompare(
                    b.script.author ?? "",
                    undefined,
                    {
                        sensitivity: "base",
                    },
                );
        case "author-desc":
            return (a, b) =>
                (b.script.author ?? "").localeCompare(
                    a.script.author ?? "",
                    undefined,
                    {
                        sensitivity: "base",
                    },
                );
        case "run-asc":
            return (a, b) => b.script.runAt - a.script.runAt;
        case "run-desc":
            return (a, b) => a.script.runAt - b.script.runAt;
    }
}

export function Action() {
    const box: React.RefObject<HTMLElement | null> = useRef(null);
    const localScripts = usePlayerStorage((store) => store.scripts);
    const roomScripts = usePlayerStorage((store) => store.roomMetadata.scripts);
    const addLocalScript = usePlayerStorage((store) => store.addLocalScript);

    useRehydrate(usePlayerStorage);
    useActionResizer(BASE_HEIGHT, MAX_HEIGHT, box);

    // Search state
    const [search, setSearch] = useState("");
    const noSearch = search === "";
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sorting state
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const [sortOption, setSortOption] = useState<SortOption>("updated-desc");

    // Fuzzy search on name, description, and code
    const filteredScripts = useFuzzySearchList({
        list: [
            ...localScripts.map((script) => [script, true] as const),
            ...roomScripts.map((script) => [script, false] as const),
        ],
        queryText: search,
        getText: (item) => [
            item[0].name,
            item[0].description ?? "",
            item[0].author ?? "",
        ],
        mapResultItem: ({
            item: [script, local],
            matches: [nameRanges, descriptionRanges, authorRanges],
        }) => ({
            script,
            local,
            nameRanges: nameRanges ?? null, // map undefined -> null
            descriptionRanges: descriptionRanges ?? null, // map undefined -> null
            authorRanges: authorRanges ?? null, // map undefined -> null
        }),
    });

    // Sort scripts based on selected option
    // If search is open, don't sort the scripts since the fuzzy search already sorts by match
    const sortedScripts = useMemo(
        () =>
            noSearch
                ? [...filteredScripts].sort(getComparator(sortOption))
                : filteredScripts,
        [noSearch, sortOption, filteredScripts],
    );

    // Focus input when search bar opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    return (
        <Box ref={box}>
            {/* Header and top buttons */}
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
                    action={
                        <Tooltip title="Settings">
                            <IconButton onClick={openSettingsPopover}>
                                <Settings />
                            </IconButton>
                        </Tooltip>
                    }
                    sx={{ flex: 1 }}
                />
            </Stack>
            {/* Search and filter row */}
            <Stack direction="row" alignItems="center" spacing={1} px={2}>
                {searchOpen ? (
                    <TextField
                        inputRef={searchInputRef}
                        fullWidth
                        size="small"
                        placeholder="Search scripts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                                type: "search",
                            },
                        }}
                        onBlur={() => {
                            if (noSearch) {
                                setSearchOpen(false);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                e.preventDefault();
                                setSearchOpen(false);
                            }
                        }}
                    />
                ) : (
                    <>
                        <Tooltip title="Search scripts">
                            <IconButton onClick={() => setSearchOpen(true)}>
                                <Search />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Sort scripts">
                            <IconButton
                                onClick={(e) =>
                                    setSortAnchorEl(e.currentTarget)
                                }
                            >
                                <Sort />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={sortAnchorEl}
                            open={Boolean(sortAnchorEl)}
                            onClose={() => setSortAnchorEl(null)}
                        >
                            <MenuItem
                                selected={sortOption === "name-asc"}
                                onClick={() => {
                                    setSortOption("name-asc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <SortByAlpha />
                                    <ArrowUpward />
                                </ListItemIcon>
                                Name (A-Z)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "name-desc"}
                                onClick={() => {
                                    setSortOption("name-desc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <SortByAlpha />
                                    <ArrowDownward />
                                </ListItemIcon>
                                Name (Z-A)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "created-desc"}
                                onClick={() => {
                                    setSortOption("created-desc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <AccessTime />
                                    <ArrowUpward />
                                </ListItemIcon>
                                Created Time (new to old)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "created-asc"}
                                onClick={() => {
                                    setSortOption("created-asc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <AccessTime />
                                    <ArrowDownward />
                                </ListItemIcon>
                                Created Time (old to new)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "updated-desc"}
                                onClick={() => {
                                    setSortOption("updated-desc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Update />
                                    <ArrowUpward />
                                </ListItemIcon>
                                Updated Time (new to old)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "updated-asc"}
                                onClick={() => {
                                    setSortOption("updated-asc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Update />
                                    <ArrowDownward />
                                </ListItemIcon>
                                Updated Time (old to new)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "author-asc"}
                                onClick={() => {
                                    setSortOption("author-asc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Person />
                                    <ArrowUpward />
                                </ListItemIcon>
                                Author (A-Z)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "author-desc"}
                                onClick={() => {
                                    setSortOption("author-desc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Person />
                                    <ArrowDownward />
                                </ListItemIcon>
                                Author (Z-A)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "run-asc"}
                                onClick={() => {
                                    setSortOption("run-asc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <PlayCircleOutlineTwoTone />
                                    <ArrowUpward />
                                </ListItemIcon>
                                Run (new to old)
                            </MenuItem>
                            <MenuItem
                                selected={sortOption === "run-desc"}
                                onClick={() => {
                                    setSortOption("run-desc");
                                    setSortAnchorEl(null);
                                }}
                            >
                                <ListItemIcon>
                                    <PlayCircleOutlineTwoTone />
                                    <ArrowDownward />
                                </ListItemIcon>
                                Run (old to new)
                            </MenuItem>
                        </Menu>
                    </>
                )}
            </Stack>
            {/* List of scripts */}
            {sortedScripts.length > 0 ? (
                <List>
                    {sortedScripts.map((scriptData) => (
                        <ListItem key={scriptData.script.id}>
                            <ScriptCard {...scriptData} />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Box sx={{ px: 2 }} fontStyle={"italic"} color={"lightgray"}>
                    No scripts found. Click '+' to create a new script, or
                    import one from a file or URL.
                    <br></br>
                    Want some ideas? Try importing from these links:
                    <ul>
                        <li>
                            <Link
                                href="https://gist.github.com/desain/cbfdce2b7329fcae2919a479ff1d3e44"
                                target="_blank"
                            >
                                Living Lines
                            </Link>
                            &nbsp;(maintain a line between tokens)
                        </li>
                        <li>
                            <Link
                                href="https://gist.github.com/desain/5315c2c18ba469cd85534e8c29f8abbc"
                                target="_blank"
                            >
                                Shake It Off
                            </Link>
                            &nbsp;(shake the screen when a token moves)
                        </li>
                        <li>
                            <Link
                                href="https://gist.github.com/desain/e8f8f769cd32608c4d99415ad3ee9f25"
                                target="_blank"
                            >
                                Portals
                            </Link>
                            &nbsp;(make two shapes portals to each other)
                        </li>
                        <li>
                            <Link
                                href="https://gist.github.com/desain/38977393433dfc6242eab280abe416fa"
                                target="_blank"
                            >
                                Inversionify
                            </Link>
                            &nbsp;(make a shape invert the colors underneath it)
                        </li>
                    </ul>
                </Box>
            )}
            <Divider />
            <Stack direction={"row"} justifyContent={"center"}>
                <Tooltip title="Create new script">
                    <IconButton onClick={() => openEditModal()}>
                        <Add />
                    </IconButton>
                </Tooltip>
                <ImportButton addScript={addLocalScript} />
                <UploadScriptButton onReceiveScript={addLocalScript} />
            </Stack>
        </Box>
    );
}
