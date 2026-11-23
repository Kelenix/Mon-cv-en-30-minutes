"use server";

import { refresh } from "next/cache";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import { getCurrentUser } from "@/features/auth/session";
import { hashClientIp } from "@/lib/ip-hash";
import { createClient } from "@/lib/supabase/server";
import { generateCvForUser } from "./generation";
import { generateCvSchema, updateCvSchema } from "./schemas";

// Actions du CV (docs/system-design.md §3) : chaque action revérifie la session et revalide son
// entrée côté serveur.

/** Génère un CV à partir des 5 réponses (US-11, US-42) et renvoie son identifiant. */
export async function generateCv(
  input: unknown,
): Promise<ActionResult<{ cvId: string }>> {
  const parsed = generateCvSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const result = await generateCvForUser(user, {
    ...parsed.data,
    ipHash: await hashClientIp(),
  });
  if (!result.ok) return result;
  // Crédits débités : le solde de l'en-tête est relu.
  if (result.data.charged) refresh();
  return ok({ cvId: result.data.cvId });
}

/** Enregistre les corrections de l'utilisateur (US-14) : gratuit, par le client soumis à la RLS. */
export async function updateCv(
  input: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  const parsed = updateCvSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .update({ content: parsed.data.content })
    .eq("id", parsed.data.cvId)
    .select("updated_at")
    .maybeSingle();
  if (error) return fail("INTERNAL");
  return data ? ok({ updatedAt: data.updated_at }) : fail("NOT_FOUND");
}
