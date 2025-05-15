import { Autocomplete, TextField } from "@mui/material";
import type { FC } from "react";
import { useShallow } from "zustand/shallow";
import { usePlayerStorage } from "../state/usePlayerStorage";

export type ScriptPickerOption = Readonly<{
    label: string;
    id: string;
}>;

type ScriptPickerProps = Readonly<{
    value: ScriptPickerOption | null;
    onChange: (scriptOption: ScriptPickerOption | null) => void;
}>;

export const ScriptPicker: FC<ScriptPickerProps> = ({ value, onChange }) => {
    const scripts = usePlayerStorage(
        useShallow((store) => store.getAllScripts()),
    );
    return (
        <Autocomplete
            autoComplete
            autoHighlight
            autoSelect
            value={value}
            onChange={(_e, v) => onChange(v)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            options={[...scripts]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((script) => ({
                    label: script.name,
                    id: script.id,
                }))}
            renderInput={(params) => (
                <TextField {...params} label="Choose a script" />
            )}
        />
    );
};
