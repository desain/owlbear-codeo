import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll } from "owlbear-utils";
import { usePlayerStorage } from "./usePlayerStorage";

/**
 *
 * @param syncParams
 * @returns [Promise that resolves once store has initialized, function to stop syncing]
 */
export function startSyncing(): [Promise<void>, VoidFunction] {
    // console.log("startSyncing");
    const store = usePlayerStorage.getState();

    const sceneReadyInitialized = OBR.scene.isReady().then(store.setSceneReady);
    const unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        store.setSceneReady(ready);
    });

    const playerColorInitialized = OBR.player
        .getColor()
        .then(store.setPlayerColor);
    const unsubscribePlayer = OBR.player.onChange((player) => {
        store.setPlayerColor(player.color);
    });

    return [
        Promise.all([sceneReadyInitialized, playerColorInitialized]).then(
            () => void 0,
        ),
        deferCallAll(unsubscribeSceneReady, unsubscribePlayer),
    ];
}
