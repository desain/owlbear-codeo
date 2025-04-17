import { Box, Typography } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import { useMemo } from "react";
import { SHORTCUT_OPTIONS } from "../constants";
import { usePlayerStorage } from "../state/usePlayerStorage";
import { ScriptPicker, ScriptPickerOption } from "../ui/ScriptPicker";

function ShortcutSetting({ shortcut }: { shortcut: string }) {
    const setToolShortcut = usePlayerStorage((state) => state.setToolShortcut);
    const removeToolShortcut = usePlayerStorage(
        (state) => state.removeToolShortcut,
    );
    const scripts = usePlayerStorage((state) => state.scripts);
    const mappedScriptId = usePlayerStorage(
        (store) => store.toolMappings[shortcut],
    );

    const mappedScript = useMemo(
        () => scripts.find((s) => s.id === mappedScriptId),
        [scripts, mappedScriptId],
    );

    const handleScriptChange = (
        shortcut: string,
        option: ScriptPickerOption | null,
    ) => {
        if (option) {
            setToolShortcut(shortcut, option.id);
        } else {
            removeToolShortcut(shortcut);
        }
    };

    const value = mappedScript
        ? { label: mappedScript.name, id: mappedScript.id }
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
                    scripts={scripts}
                    value={value}
                    onChange={(option) => handleScriptChange(shortcut, option)}
                />
            </Box>
        </Stack>
    );
}

export function Settings() {
    const toolEnabled = usePlayerStorage((state) => state.toolEnabled);
    const setToolEnabled = usePlayerStorage((state) => state.setToolEnabled);

    const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setToolEnabled(event.target.checked);
    };

    return (
        <Box sx={{ p: 2, minWidth: 300 }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={toolEnabled}
                        onChange={handleToggleChange}
                    />
                }
                label="Enable Shortcut Tool"
                sx={{ mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
                Shortcut Tool Mappings
            </Typography>
            <Stack spacing={1}>
                {SHORTCUT_OPTIONS.map((shortcut) => (
                    <ShortcutSetting key={shortcut} shortcut={shortcut} />
                ))}
            </Stack>
        </Box>
    );
}
