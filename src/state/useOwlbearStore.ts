import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface OwlbearStore {
    sceneReady: boolean;
    playerColor: string;
    setSceneReady(this: void, sceneReady: boolean): void;
    setPlayerColor(this: void, playerColor: string): void;
}

export const useOwlbearStore = create<OwlbearStore>()(
    subscribeWithSelector((set) => ({
        // dummy values
        sceneReady: false,
        playerColor: "#FFFFFF",
        setSceneReady: (sceneReady: boolean) => set({ sceneReady }),
        setPlayerColor: (playerColor) => set({ playerColor }),
    })),
);
