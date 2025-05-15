import { Upload } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useRef } from "react";
import type { CodeoScript } from "../script/CodeoScript";
import { parseJsonOrCode } from "../script/parseScript";

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
        try {
            const text = e.target?.result;
            if (typeof text !== "string") {
                throw new Error("File content is not a string");
            }
            const script = {
                name: file.name,
                ...parseJsonOrCode(text),
            };
            onReceiveScript(script);
        } catch (e) {
            console.error("Failed to parse script:", e);
            void OBR.notification.show(
                `Failed to parse script: ${String(e)}`,
                "ERROR",
            );
        }
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
                accept="application/json, text/javascript"
            />
        </>
    );
}
