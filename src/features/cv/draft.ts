import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { localeSchema } from "@/i18n/locale-schema";
import type { AppLocale } from "@/i18n/routing";
import { type CountryCode, countrySchema } from "./countries";
import { ANSWER_KEYS, ANSWER_MAX, type CvAnswers } from "./schemas";
import { type CvTemplate, cvTemplateSchema } from "./templates";

// Brouillon des 5 questions, gardé dans le navigateur (docs/architecture.md §6) : il survit au
// rechargement, au retour en arrière et à la connexion (US-10 c.4) ; effacé une fois le CV
// enregistré. Une copie en mémoire prend le relais si le stockage est indisponible.

const STORAGE_KEY = "mon-cv-30s:brouillon";

export type Draft = {
  answers: CvAnswers;
  /** Question affichée (0 à 4). */
  step: number;
  /** Langue du CV choisie à la dernière question (défaut : langue de l'interface). */
  language?: AppLocale;
  /** Pays visé, choisi à la dernière question (Inc-15). */
  country?: CountryCode;
  /** Modèle choisi dans la vitrine des modèles (Inc-15). */
  template?: CvTemplate;
};

export const EMPTY_ANSWERS: CvAnswers = {
  job: "",
  experiences: "",
  skills: "",
  education: "",
  goal: "",
};

const answer = z.string().max(ANSWER_MAX).catch("");
const draftSchema = z.object({
  answers: z
    .object({
      job: answer,
      experiences: answer,
      skills: answer,
      education: answer,
      goal: answer,
    })
    .catch(EMPTY_ANSWERS),
  step: z
    .number()
    .int()
    .min(0)
    .max(ANSWER_KEYS.length - 1)
    .catch(0),
  language: localeSchema.optional().catch(undefined),
  country: countrySchema.optional().catch(undefined),
  template: cvTemplateSchema.optional().catch(undefined),
});

function parseDraft(raw: string): Draft {
  try {
    return draftSchema.parse(JSON.parse(raw));
  } catch {
    return { answers: EMPTY_ANSWERS, step: 0 };
  }
}

let memory: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  memory = null;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function read(): string {
  if (memory !== null) return memory;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function write(raw: string) {
  memory = raw;
  try {
    if (raw) localStorage.setItem(STORAGE_KEY, raw);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage refusé (navigation privée) : la copie en mémoire suffit pour cette visite.
  }
  notify();
}

export function saveDraft(draft: Draft) {
  write(JSON.stringify(draft));
}

export function clearDraft() {
  write("");
}

/**
 * Brouillon courant : `null` tant que la page n'est pas interactive (le serveur ne le connaît
 * pas), `undefined` s'il n'y en a pas.
 */
export function useDraft(): Draft | null | undefined {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => {
    if (raw === null) return null;
    return raw ? parseDraft(raw) : undefined;
  }, [raw]);
}
