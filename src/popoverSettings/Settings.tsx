import { Box, FormGroup, FormHelperText, Typography } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import { broadcast } from "../broadcast/handleBroadcast";
import type { Shortcut } from "../constants";
import { SHORTCUT_OPTIONS } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { getExecution } from "../tool/shortcutTool";
import type { ScriptPickerOption } from "../ui/ScriptPicker";
import { ScriptPicker } from "../ui/ScriptPicker";
import { useSelectedScript } from "../useSelectedScript";

function ShortcutSetting({ shortcut }: { shortcut: Shortcut }) {
    const setToolShortcut = usePlayerStorage((state) => state.setToolShortcut);
    const removeToolShortcut = usePlayerStorage(
        (state) => state.removeToolShortcut,
    );
    const mappedScriptId = usePlayerStorage(
        (store) => store.toolMappings[shortcut],
    );
    const mappedScript = useSelectedScript(mappedScriptId);

    const handleScriptChange = async (
        shortcut: Shortcut,
        option: ScriptPickerOption | null,
    ) => {
        if (option) {
            setToolShortcut(shortcut, option.id);
        } else {
            removeToolShortcut(shortcut);
        }

        if (mappedScriptId && option?.id !== mappedScriptId) {
            // Switching scripts, so stop any shortcut-based
            // execution for the old one
            const executionId = await getExecution(shortcut);
            if (executionId) {
                await broadcast({
                    type: "STOP_EXECUTION",
                    id: mappedScriptId,
                    executionId,
                });
            }
        }
    };

    const value = mappedScript
        ? { label: mappedScript[0].name, id: mappedScript[0].id }
        : null;

    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Box
                sx={{
                    width: "40px", // Fixed width for shortcut label
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography variant="button">{shortcut}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
                <ScriptPicker
                    value={value}
                    onChange={(option) => handleScriptChange(shortcut, option)}
                />
            </Box>
        </Stack>
    );
}

export function Settings() {
    const contextMenuEnabled = usePlayerStorage(
        (state) => state.contextMenuEnabled,
    );
    const setContextMenuEnabled = usePlayerStorage(
        (state) => state.setContextMenuEnabled,
    );
    const toolEnabled = usePlayerStorage((state) => state.toolEnabled);
    const setToolEnabled = usePlayerStorage((state) => state.setToolEnabled);

    return (
        <Box sx={{ p: 2, minWidth: 300 }}>
            <Typography variant="h6">Owlbear Codeo Settings</Typography>
            <FormGroup sx={{ mb: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={contextMenuEnabled}
                            onChange={(e) =>
                                setContextMenuEnabled(e.target.checked)
                            }
                        />
                    }
                    label="Enable Context Menu"
                />
                <FormHelperText>
                    Enable a menu when right clicking on the map to add a button
                    that can run a script when double-clicked.
                </FormHelperText>
            </FormGroup>
            <FormGroup sx={{ mb: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={toolEnabled}
                            onChange={(e) => setToolEnabled(e.target.checked)}
                        />
                    }
                    label="Enable Shortcut Tool"
                />
                <FormHelperText>
                    Enable a tool that can map shortcuts to scripts.
                </FormHelperText>
            </FormGroup>
            {toolEnabled && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Shortcut Tool Mappings
                    </Typography>
                    <Stack spacing={1}>
                        {SHORTCUT_OPTIONS.map((shortcut) => (
                            <ShortcutSetting
                                key={shortcut}
                                shortcut={shortcut}
                            />
                        ))}
                    </Stack>
                </>
            )}
        </Box>
    );
}
