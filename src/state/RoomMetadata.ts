import OBR from "@owlbear-rodeo/sdk";
import type { WritableDraft } from "immer";
import { produce } from "immer";
import { isObject } from "owlbear-utils";
import { METADATA_KEY_ROOM_METADATA } from "../constants";
import { isStoredScript, type StoredScript } from "./StoredScript";
import { usePlayerStorage } from "./usePlayerStorage";

export interface RoomMetadata {
    scripts: StoredScript[];
}
export function isRoomMetadata(
    roomMetadata: unknown,
): roomMetadata is RoomMetadata {
    return (
        isObject(roomMetadata) &&
        "scripts" in roomMetadata &&
        Array.isArray(roomMetadata.scripts) &&
        roomMetadata.scripts.every(isStoredScript)
    );
}

export async function updateRoomMetadata(
    updater: (draft: WritableDraft<RoomMetadata>) => void,
) {
    const roomMetadata = usePlayerStorage.getState().roomMetadata;
    await OBR.room.setMetadata({
        [METADATA_KEY_ROOM_METADATA]: produce(roomMetadata, updater),
    });
}
