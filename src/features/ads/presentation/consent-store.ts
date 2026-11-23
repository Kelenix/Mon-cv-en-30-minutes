import { useSyncExternalStore } from "react";

// Choix du bandeau de consentement en mode simulation (en production, c'est le bandeau certifié
// de Google qui le garde) : mémorisé dans le navigateur, partagé entre les composants.

export type ConsentChoice = "granted" | "denied";
type State = { choice: ConsentChoice | null; open: boolean };

const KEY = "mon-cv-30s:consentement";
const SERVER_STATE: State = { choice: null, open: false };
let state: State | undefined;
const listeners = new Set<() => void>();

function current(): State {
  if (!state) {
    let choice: ConsentChoice | null = null;
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === "granted" || stored === "denied") choice = stored;
    } catch {
      // Stockage indisponible : le bandeau sera simplement reproposé.
    }
    state = { choice, open: false };
  }
  return state;
}

function update(next: State) {
  state = next;
  for (const listener of listeners) listener();
}

export const consentStore = {
  /** Une annonce va s'afficher : le bandeau s'ouvre si aucun choix n'est fait (US-32 c.1). */
  request() {
    const now = current();
    if (now.choice === null && !now.open) update({ ...now, open: true });
  },
  /** « Gérer les cookies » (US-32 c.3). */
  manage() {
    update({ ...current(), open: true });
  },
  choose(choice: ConsentChoice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      // Choix gardé pour la visite seulement.
    }
    update({ choice, open: false });
  },
};

export function useConsent() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    current,
    () => SERVER_STATE,
  );
}
