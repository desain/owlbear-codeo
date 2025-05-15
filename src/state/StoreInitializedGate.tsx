import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

export const StoreInitializedGate: React.FC<{
    children: React.ReactNode;
    startSyncing: () => [initialized: Promise<void>, unsubscribe: VoidFunction];
}> = ({ children, startSyncing }) => {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let unsubscribe: VoidFunction | null = null;
        OBR.onReady(() => {
            if (cancelled) {
                return;
            }
            const [initializedPromise, unsubscribeSync] = startSyncing();
            unsubscribe = unsubscribeSync;
            void initializedPromise.then(() => {
                if (cancelled) {
                    return;
                }
                setInitialized(true);
            });
        });

        return () => {
            cancelled = true;
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }
        };
    }, [startSyncing]);

    return initialized ? children : null;
};
