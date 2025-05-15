import OBR from "@owlbear-rodeo/sdk";
import { deferCallAll } from "owlbear-utils";
import { usePlayerStorage } from "./usePlayerStorage";

/**
 *
 * @param syncParams
 * @returns [Promise that resolves once store has initialized, function to stop syncing]
 */
export function startSyncing(): [
    initialized: Promise<void>,
    unsubscribe: VoidFunction,
] {
    // console.log("startSyncing");
    const { setSceneReady, handlePlayerUpdate, handleRoomMetadataUpdate } =
        usePlayerStorage.getState();

    const sceneReadyInitialized = OBR.scene.isReady().then(setSceneReady);
    const unsubscribeSceneReady = OBR.scene.onReadyChange(setSceneReady);

    const playerInitialized = Promise.all([
        OBR.player.getColor(),
        OBR.player.getName(),
        OBR.player.getRole(),
        OBR.player.getSelection(),
    ]).then(([color, name, role, selection]) =>
        handlePlayerUpdate({ color, name, role, selection }),
    );
    const unsubscribePlayer = OBR.player.onChange(handlePlayerUpdate);

    const roomMetadataInitialized = OBR.room
        .getMetadata()
        .then(handleRoomMetadataUpdate);
    const unsubscribeRoomMetadata = OBR.room.onMetadataChange(
        handleRoomMetadataUpdate,
    );

    return [
        Promise.all([
            sceneReadyInitialized,
            playerInitialized,
            roomMetadataInitialized,
        ]).then(() => void 0),
        deferCallAll(
            unsubscribeSceneReady,
            unsubscribePlayer,
            unsubscribeRoomMetadata,
        ),
    ];
}
