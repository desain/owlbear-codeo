import { useEffect } from "react";
import { LOCAL_STORAGE_STORE_NAME } from "../constants";
import { usePlayerStorage } from "./usePlayerStorage";

export function useRehydrate() {
    useEffect(() => {
        function handleStorageEvent(e: StorageEvent) {
            if (e.key === LOCAL_STORAGE_STORE_NAME) {
                usePlayerStorage.persist.rehydrate();
            }
        }

        window.addEventListener("storage", handleStorageEvent);

        return () => window.removeEventListener("storage", handleStorageEvent);
    });
}
