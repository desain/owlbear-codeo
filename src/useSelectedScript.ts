import { useMemo } from "react";
import { usePlayerStorage } from "./state/usePlayerStorage";

export function useSelectedScript(scriptId?: string) {
    return useMemo(
        () => usePlayerStorage.getState().getScriptById(scriptId),
        [scriptId],
    );
}
