import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll } from "owlbear-utils";
import { useOwlbearStore } from "./useOwlbearStore";

/**
 *
 * @param syncParams
 * @returns [Promise that resolves once store has initialized, function to stop syncing]
 */
export function startSyncing(): [Promise<void>, VoidFunction] {
    // console.log("startSyncing");
    const store = useOwlbearStore.getState();

    const sceneReadyInitialized = OBR.scene.isReady().then(store.setSceneReady);
    const unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        store.setSceneReady(ready);
    });

    return [
        Promise.all([sceneReadyInitialized]).then(() => void 0),
        deferCallAll(unsubscribeSceneReady),
    ];
}
