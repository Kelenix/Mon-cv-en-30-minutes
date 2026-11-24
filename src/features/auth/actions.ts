"use server";

import { isAuthApiError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import { env } from "@/core/env";
import { localeSchema } from "@/i18n/locale-schema";
import { type AppLocale, routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { afterSignInPath } from "./after-sign-in";
import {
  allowCodeAttempt,
  allowCodeRequest,
  verifyHuman,
} from "./bot-protection";
import { localizedPath, safeNextPath } from "./paths";

// Connexion sans mot de passe : code à 6 chiffres par e-mail ou Google (US-04,
// docs/system-design.md §3). Les entrées sont revalidées ici, quel que soit le formulaire.

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "invalidEmail" }));

const requestCodeSchema = z.object({
  locale: localeSchema,
  email: emailSchema,
});

const verifyCodeSchema = z.object({
  locale: localeSchema,
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { error: "invalidCode" }),
});

function isRateLimited(error: unknown) {
  return isAuthApiError(error) && error.status === 429;
}

function nextOrAccount(locale: AppLocale, next: unknown) {
  return safeNextPath(next) ?? localizedPath(locale, "/compte");
}

export async function requestEmailCode(
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const parsed = requestCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { locale, email } = parsed.data;

  // Robots (ADR-039) : plafond par IP, puis vérification Turnstile.
  if (!(await allowCodeRequest())) return fail("RATE_LIMITED");
  if (!(await verifyHuman(formData.get("cf-turnstile-response")))) {
    return fail("BOT_CHECK_FAILED");
  }

  // Le lien de secours de l'e-mail revient sur /auth/confirm avec la page à ouvrir ensuite.
  const confirmUrl = new URL("/auth/confirm", env.NEXT_PUBLIC_SITE_URL);
  confirmUrl.searchParams.set(
    "next",
    nextOrAccount(locale, formData.get("next")),
  );

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: confirmUrl.toString(),
      // Langue des e-mails de connexion, reprise par le profil à l'inscription (US-41).
      data: { locale },
    },
  });

  if (error) {
    if (isRateLimited(error)) return fail("RATE_LIMITED");
    console.error("Envoi du code de connexion impossible", error.code);
    return fail("INTERNAL");
  }
  return ok({ email });
}

export async function verifyEmailCode(
  formData: FormData,
): Promise<ActionResult<never>> {
  const parsed = verifyCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { locale, email, code } = parsed.data;
  if (!(await allowCodeAttempt(email))) return fail("RATE_LIMITED");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (error) {
    return isRateLimited(error)
      ? fail("RATE_LIMITED")
      : fail("VALIDATION_ERROR", { code: "invalidCode" });
  }

  redirect(await afterSignInPath(supabase, locale, formData.get("next")));
}

export async function signInWithGoogle(formData: FormData) {
  const locale = localeSchema
    .catch(routing.defaultLocale)
    .parse(formData.get("locale"));
  const callbackUrl = new URL("/auth/callback", env.NEXT_PUBLIC_SITE_URL);
  callbackUrl.searchParams.set(
    "next",
    nextOrAccount(locale, formData.get("next")),
  );

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    redirect(`${localizedPath(locale, "/connexion")}?erreur=google`);
  }
  redirect(data.url);
}

export async function signOut(formData: FormData) {
  const locale = localeSchema
    .catch(routing.defaultLocale)
    .parse(formData.get("locale"));
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(localizedPath(locale, "/"));
}
