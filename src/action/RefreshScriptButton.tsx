import { Update } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { importScript } from "../script/importScript";
import {
    ScriptContainerUtils,
    withLocalAndRemoteContainers,
} from "../state/ScriptContainerUtils";
import type { StoredScript } from "../state/StoredScript";

export function RefreshScriptButton({
    disabled,
    script,
}: {
    disabled: boolean;
    script: StoredScript;
}) {
    return (
        <Tooltip title="Fetch latest script">
            <span>
                {/* Needed so tooltip can get events from its child */}

                <IconButton
                    disabled={disabled}
                    onClick={async () => {
                        if (!script.url) {
                            return;
                        }
                        const updated = await importScript(script.url);
                        if (!updated) {
                            return;
                        }
                        await withLocalAndRemoteContainers((container) => {
                            ScriptContainerUtils.update(
                                container,
                                script.id,
                                updated,
                            );
                        });
                        void OBR.notification.show("Updated script", "SUCCESS");
                    }}
                >
                    <Update />
                </IconButton>
            </span>
        </Tooltip>
    );
}
