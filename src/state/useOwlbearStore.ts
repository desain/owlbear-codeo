import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface OwlbearStore {
    sceneReady: boolean;
    setSceneReady: (sceneReady: boolean) => void;
}

export const useOwlbearStore = create<OwlbearStore>()(
    subscribeWithSelector((set) => ({
        // dummy values
        sceneReady: false,
        setSceneReady: (sceneReady: boolean) => set({ sceneReady }),
    })),
);
