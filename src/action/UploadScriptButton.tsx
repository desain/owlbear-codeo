import { Upload } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useRef } from "react";
import { CodeoScript } from "../CodeoScript";
import { parseJsonOrCode } from "../importScript";

const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    onReceiveScript: (
        script: Omit<CodeoScript, "createdAt" | "updatedAt">,
    ) => void,
) => {
    const file = event.target.files?.[0];
    if (!file) {
        console.warn("No file found");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        // result must be string because onload was called from readAsText
        const text = e.target?.result as string;
        const script = {
            name: file.name,
            ...parseJsonOrCode(text),
        };
        onReceiveScript(script);
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
};

export function UploadScriptButton({
    onReceiveScript,
}: {
    onReceiveScript: (
        script: Omit<CodeoScript, "createdAt" | "updatedAt">,
    ) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <Tooltip title="Upload script from file">
                <IconButton onClick={handleUploadClick}>
                    <Upload />
                </IconButton>
            </Tooltip>
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e, onReceiveScript)}
                style={{ display: "none" }}
                accept=".json"
            />
        </>
    );
}
