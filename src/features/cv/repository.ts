import "server-only";
import { cache } from "react";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { type CvContent, cvContentSchema } from "./schemas";

// Lecture des CV du compte connecté, par le client de l'utilisateur : la RLS limite tout à ses
// propres CV (un CV d'un autre compte est simplement introuvable).

export type CvSummary = {
  id: string;
  title: string;
  updatedAt: string;
  proUnlocked: boolean;
};

/** CV conservés, du plus récemment modifié au plus ancien. */
export const listOwnCvs = cache(async (): Promise<CvSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .select("id, title, updated_at, pro_unlocked_at")
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data.map((cv) => ({
    id: cv.id,
    title: cv.title,
    updatedAt: cv.updated_at,
    proUnlocked: cv.pro_unlocked_at !== null,
  }));
});

export type Cv = {
  id: string;
  title: string;
  /** Langue du contenu, des intitulés et du filigrane (US-42). */
  language: AppLocale;
  content: CvContent;
};

export async function getOwnCv(id: string): Promise<Cv | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .select("id, title, language, content")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, content: cvContentSchema.parse(data.content) };
}
