import { Autocomplete, TextField } from "@mui/material";
import { FC } from "react";
import { StoredScript } from "../state/usePlayerStorage";

export type ScriptPickerOption = Readonly<{
    label: string;
    id: string;
}>;

type ScriptPickerProps = Readonly<{
    scripts: StoredScript[];
    value: ScriptPickerOption | null;
    onChange: (scriptOption: ScriptPickerOption | null) => void;
}>;

export const ScriptPicker: FC<ScriptPickerProps> = ({
    scripts,
    value,
    onChange,
}) => (
    <Autocomplete
        autoComplete
        autoHighlight
        autoSelect
        value={value}
        onChange={(_e, v) => onChange(v)}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        options={scripts.map((script) => ({
            label: script.name,
            id: script.id,
        }))}
        renderInput={(params) => (
            <TextField {...params} label="Choose a script" />
        )}
    />
);
