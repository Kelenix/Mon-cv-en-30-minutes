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
import { countrySchema } from "./countries";
import { deleteOwnCvPhoto, isJpeg, saveOwnCvPhoto } from "./photo";
import { generateCvSchema, updateCvSchema } from "./schemas";
import { CV_PHOTO, cvTemplateSchema } from "./templates";

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
 * Change le modèle de mise en page ou le pays visé (Inc-15), par le client soumis à la RLS. Tout
 * modèle peut s'essayer ; le téléchargement d'un modèle payant est vérifié par la route d'export.
 */
export async function setCvLayout(
  input: unknown,
): Promise<ActionResult<{ saved: true }>> {
  const parsed = z
    .object({
      cvId: z.uuid(),
      template: cvTemplateSchema.optional(),
      targetCountry: countrySchema.optional(),
    })
    .refine((value) => value.template || value.targetCountry)
    .safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const { cvId, template, targetCountry } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .update({ template, target_country: targetCountry })
    .eq("id", cvId)
    .select("id")
    .maybeSingle();
  if (error) return fail("INTERNAL");
  return data ? ok({ saved: true }) : fail("NOT_FOUND");
}

/**
 * Pose ou remplace la photo d'un CV (US-45) : JPEG recadré dans le navigateur, contrôlé ici
 * (format et taille), enregistré par le client soumis à la RLS.
 */
export async function setCvPhoto(
  input: unknown,
): Promise<ActionResult<{ saved: true }>> {
  const parsed = z
    .object({
      cvId: z.uuid(),
      image: z.base64().max(Math.ceil((CV_PHOTO.maxBytes * 4) / 3) + 4),
    })
    .safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const image = Buffer.from(parsed.data.image, "base64");
  if (image.length > CV_PHOTO.maxBytes || !isJpeg(image)) {
    return fail("VALIDATION_ERROR");
  }
  return (await saveOwnCvPhoto(user.id, parsed.data.cvId, image))
    ? ok({ saved: true })
    : fail("NOT_FOUND");
}

/** Retire la photo d'un CV (US-45 c.3). */
export async function removeCvPhoto(
  input: unknown,
): Promise<ActionResult<{ removed: true }>> {
  const parsed = z.object({ cvId: z.uuid() }).safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  return (await deleteOwnCvPhoto(parsed.data.cvId))
    ? ok({ removed: true })
    : fail("INTERNAL");
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
