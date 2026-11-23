import "server-only";
import { cache } from "react";
import type { AppLocale } from "@/i18n/routing";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { type CvContent, cvContentSchema } from "./schemas";

// Lecture des CV du compte connecté, par le client de l'utilisateur : la RLS limite tout à ses
// propres CV (un CV d'un autre compte est simplement introuvable).

export type CvSummary = {
  id: string;
  title: string;
  language: AppLocale;
  updatedAt: string;
  proUnlocked: boolean;
};

const SUMMARY_COLUMNS = "id, title, language, updated_at, pro_unlocked_at";

function toSummary(cv: {
  id: string;
  title: string;
  language: AppLocale;
  updated_at: string;
  pro_unlocked_at: string | null;
}): CvSummary {
  return {
    id: cv.id,
    title: cv.title,
    language: cv.language,
    updatedAt: cv.updated_at,
    proUnlocked: cv.pro_unlocked_at !== null,
  };
}

/** CV conservés, du plus récemment modifié au plus ancien. */
export const listOwnCvs = cache(async (): Promise<CvSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .select(SUMMARY_COLUMNS)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data.map(toSummary);
});

/** Historique « Mes CV » (US-31) : les `limit` CV les plus récents et le nombre total. */
export async function listOwnCvsPage(limit: number) {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("cvs")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { cvs: data.map(toSummary), total: count ?? data.length };
}

export type Cv = {
  id: string;
  title: string;
  /** Langue du contenu, des intitulés et du filigrane (US-42). */
  language: AppLocale;
  content: CvContent;
  /** CV Pro acheté pour ce CV : exports sans filigrane et DOCX (US-17). */
  proUnlocked: boolean;
};

/** CV du compte connecté, lu une seule fois par requête (mise en page et page). */
export const getOwnCv = cache(async (id: string): Promise<Cv | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .select("id, title, language, content, pro_unlocked_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    language: data.language,
    content: cvContentSchema.parse(data.content),
    proUnlocked: data.pro_unlocked_at !== null,
  };
});

/** Derniers contenus générés d'un type pour un CV (H20), du plus récent au plus ancien. */
export async function listGenerations(
  cvId: string,
  kind: Database["public"]["Enums"]["generation_kind"],
  limit = 5,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .select("id, language, input, output, created_at")
    .eq("cv_id", cvId)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
