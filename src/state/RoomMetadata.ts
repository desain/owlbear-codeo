import { isObject } from "owlbear-utils";
import { isStoredScript, type StoredScript } from "./StoredScript";

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
