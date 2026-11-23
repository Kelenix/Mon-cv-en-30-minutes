import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Faux dans le HTML du serveur, vrai dès que la page est interactive (après l'hydratation). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
