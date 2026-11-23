"use server";

import { refresh } from "next/cache";
import { z } from "zod";
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

/**
 * Supprime un CV et ses contenus générés (US-31 c.5), par le client soumis à la RLS : un CV d'un
 * autre compte est introuvable. Un achat CV Pro reste dans l'historique des achats.
 */
export async function deleteCv(
  input: unknown,
): Promise<ActionResult<{ deleted: true }>> {
  const parsed = z.object({ cvId: z.uuid() }).safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .delete()
    .eq("id", parsed.data.cvId)
    .select("id");
  if (error) return fail("INTERNAL");
  if (data.length === 0) return fail("NOT_FOUND");
  refresh();
  return ok({ deleted: true });
}
