import {
    AccessTime,
    Add,
    ArrowDownward,
    ArrowUpward,
    Delete,
    Edit,
    MoreVert,
    Person,
    PlayCircleOutlineTwoTone,
    Search,
    Sort,
    SortByAlpha,
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
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { HighlightRanges } from "@nozbe/microfuzz";
import { Highlight, useFuzzySearchList } from "@nozbe/microfuzz/react";
import OBR from "@owlbear-rodeo/sdk";
import { useActionResizer } from "owlbear-utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { MODAL_EDIT_SCRIPT_ID, SCRIPT_ID_PARAM } from "../constants";
import { Execution } from "../Execution";
import { runScript } from "../runScript";
import { StoredScript, usePlayerStorage } from "../state/usePlayerStorage";
import { useRehydrate } from "../state/useRehydrate";
import { DownloadScriptButton } from "./DownloadScriptButton";
import { ImportButton } from "./ImportButton";
import { RefreshScriptButton } from "./RefreshScriptButton";
import { UploadScriptButton } from "./UploadScriptButton";

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

function ExecutionItem({
    script,
    execution,
}: {
    script: StoredScript;
    execution: Execution;
}) {
    const stopExecution = usePlayerStorage((store) => store.stopExecution);

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
                        stopExecution(script.id, execution.executionId)
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

function OverflowMenu({ script }: { script: StoredScript }) {
    const removeScript = usePlayerStorage((store) => store.removeScript);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
                <MenuItem onClick={() => removeScript(script.id)}>
                    <ListItemIcon>
                        <Delete />
                    </ListItemIcon>
                    Delete
                </MenuItem>
            </Menu>
        </>
    );
}

function ScriptCard({
    script,
    nameRanges,
    descriptionRanges,
    authorRanges,
}: {
    script: StoredScript;
    nameRanges: HighlightRanges | null;
    descriptionRanges: HighlightRanges | null;
    authorRanges: HighlightRanges | null;
}) {
    const executions =
        usePlayerStorage((store) => store.executions.get(script.id)) ?? [];

    const isImported = script.url !== undefined;

    return (
        <Card sx={{ width: "100%" }}>
            <CardHeader
                title={
                    <Stack direction="row" alignItems="center" gap={1}>
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
                action={<OverflowMenu script={script} />}
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
                </Tooltip>{" "}
                <Tooltip title={isImported ? "View" : "Edit script"}>
                    <IconButton onClick={() => void openEditModal(script.id)}>
                        {isImported ? <Visibility /> : <Edit />}
                    </IconButton>
                </Tooltip>
                <DownloadScriptButton script={script} />
                {script.url && <RefreshScriptButton script={script} />}
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
    | "author-desc";

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
    }
}

export function Action() {
    const box: React.RefObject<HTMLElement | null> = useRef(null);
    const scripts = usePlayerStorage((store) => store.scripts);
    const addScript = usePlayerStorage((store) => store.addScript);

    useRehydrate();
    useActionResizer(BASE_HEIGHT, MAX_HEIGHT, box);

    // Search state
    const [search, setSearch] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sorting state
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const [sortOption, setSortOption] = useState<SortOption>("updated-desc");

    // Fuzzy search on name, description, and code
    const filteredScripts = useFuzzySearchList({
        list: scripts,
        queryText: search,
        getText: (item) => [
            item.name,
            item.description ?? "",
            item.author ?? "",
        ],
        mapResultItem: ({
            item,
            matches: [nameRanges, descriptionRanges, authorRanges],
        }) => ({
            script: item,
            nameRanges,
            descriptionRanges,
            authorRanges,
        }),
    });

    // Sort scripts based on selected option
    // If search is open, don't sort the scripts since the fuzzy search already sorts by match
    const sortedScripts = useMemo(
        () =>
            search === ""
                ? [...filteredScripts].sort(getComparator(sortOption))
                : filteredScripts,
        [search === "", sortOption, filteredScripts],
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
                    sx={{ flex: 1 }}
                />
                <Tooltip title="Create new script">
                    <IconButton onClick={() => openEditModal()}>
                        <Add />
                    </IconButton>
                </Tooltip>
                <ImportButton addScript={addScript} />
                <UploadScriptButton onReceiveScript={addScript} />
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
                            if (search === "") {
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
                <Typography
                    color="textSecondary"
                    sx={{ p: 2, fontStyle: "italic" }}
                >
                    No scripts found. Click 'Add' to create a new script, or
                    import one from a file or URL.
                </Typography>
            )}
        </Box>
    );
}
