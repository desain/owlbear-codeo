import type { CodeoScript } from "../script/CodeoScript";
import type { StoredScript } from "./StoredScript";

export interface HasScripts {
    scripts: StoredScript[];
}

export function addScript(hasScripts: HasScripts, script: CodeoScript) {
    const now = Date.now();
    hasScripts.scripts.push({
        ...script,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        runAt: 0,
    });
}

export function updateScript(
    hasScripts: HasScripts,
    id: string,
    updates: Partial<CodeoScript>,
) {
    hasScripts.scripts = hasScripts.scripts.map((script) =>
        script.id === id
            ? {
                  ...script,
                  ...updates,
                  id,
                  createdAt: script.createdAt,
                  updatedAt: Date.now(),
              }
            : script,
    );
}
