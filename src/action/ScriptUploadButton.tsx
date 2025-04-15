import { Upload } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useRef } from "react";
import { CodeoScript, isCodeoScript } from "../CodeoScript";

const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    onReceiveScript: (script: CodeoScript) => void,
) => {
    const file = event.target.files?.[0];
    if (!file) {
        console.warn("No file found");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = JSON.parse(e.target?.result as string);
            if (isCodeoScript(content)) {
                onReceiveScript(content);
            } else {
                console.error("Invalid script file format");
                void OBR.notification.show(
                    "Invalid script file format",
                    "ERROR",
                );
            }
        } catch (error) {
            console.error("Error parsing script file:", error);
            void OBR.notification.show(
                "Error parsing script file:" + String(error),
                "ERROR",
            );
        }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
};

export function ScriptUploadButton({
    onReceiveScript,
}: {
    onReceiveScript: (script: CodeoScript) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <Tooltip title="Upload script from file">
                <IconButton color="primary" onClick={handleUploadClick}>
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
