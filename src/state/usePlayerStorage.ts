import OBR from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CodeoScript } from "../CodeoScript";
import { LOCAL_STORAGE_STORE_NAME } from "../constants";

const ObrSceneReady = new Promise<void>((resolve) => {
    OBR.onReady(async () => {
        if (await OBR.scene.isReady()) {
            resolve();
        } else {
            const unsubscribeScene = OBR.scene.onReadyChange((ready) => {
                if (ready) {
                    unsubscribeScene();
                    resolve();
                }
            });
        }
    });
});

async function fetchDefaults(): Promise<CodeoScript[]> {
    await ObrSceneReady;
    return [];
}

export interface PlayerLocalStorage {
    hasSensibleValues: boolean;
    scripts: CodeoScript[];
    _markSensible(this: void): void;
    addScript(
        this: void,
        script: Omit<CodeoScript, "id" | "createdAt" | "updatedAt">,
    ): void;
    removeScript(this: void, id: string): void;
    updateScript(
        this: void,
        id: string,
        updates: Partial<Omit<CodeoScript, "id" | "createdAt" | "updatedAt">>,
    ): void;
}

export const usePlayerStorage = create<PlayerLocalStorage>()(
    persist(
        (set) => ({
            hasSensibleValues: false,
            scripts: [],
            _markSensible() {
                set({ hasSensibleValues: true });
            },
            addScript(scriptData) {
                const now = Date.now();
                const newScript: CodeoScript = {
                    ...scriptData,
                    id: crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({
                    scripts: [...state.scripts, newScript],
                }));
            },
            removeScript(id) {
                set((state) => ({
                    scripts: state.scripts.filter((script) => script.id !== id),
                }));
            },
            updateScript(id, updates) {
                set((state) => ({
                    scripts: state.scripts.map((script) =>
                        script.id === id
                            ? { ...script, ...updates, updatedAt: Date.now() }
                            : script,
                    ),
                }));
            },
        }),
        {
            name: LOCAL_STORAGE_STORE_NAME,
            onRehydrateStorage() {
                return (state, error) => {
                    if (state) {
                        if (!state.hasSensibleValues) {
                            void fetchDefaults().then((defaultScripts) => {
                                state.scripts = defaultScripts;
                                state._markSensible();
                            });
                        }
                    } else if (error) {
                        console.error(
                            "Error hydrating player settings store",
                            error,
                        );
                    }
                };
            },
        },
    ),
);
