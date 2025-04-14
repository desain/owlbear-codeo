import OBR from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { persist } from "zustand/middleware";
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

async function fetchDefaults(): Promise<null> {
    await ObrSceneReady;
    return null;
}

export interface PlayerSettingsStore {
    hasSensibleValues: boolean;
    _markSensible(this: void): void;
}

export const usePlayerSettings = create<PlayerSettingsStore>()(
    persist(
        (set) => ({
            hasSensibleValues: false,
            _markSensible() {
                set({ hasSensibleValues: true });
            },
        }),
        {
            name: LOCAL_STORAGE_STORE_NAME,
            onRehydrateStorage() {
                return (state, error) => {
                    if (state) {
                        if (!state.hasSensibleValues) {
                            void fetchDefaults().then(() => {
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
