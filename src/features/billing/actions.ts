"use server";

import { getTranslations } from "next-intl/server";
import type Stripe from "stripe";
import { z } from "zod";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import { env } from "@/core/env";
import { localizedPath } from "@/features/auth/paths";
import { type CurrentUser, getCurrentUser } from "@/features/auth/session";
import { getOwnCv } from "@/features/cv/repository";
import {
  BILLING_INTERVALS,
  CREDIT_PACKS,
  PLAN_TIERS,
  TRIAL,
} from "@/features/plans/catalog";
import { getOwnProfile } from "@/features/profile/data/profile-repository";
import { localeSchema } from "@/i18n/locale-schema";
import type { AppLocale } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  type CheckoutItem,
  checkoutLookupKey,
  checkoutParams,
} from "./stripe-mapping";
import { getStripe, priceIdFor } from "./stripe";
import { getCurrentSubscription } from "./subscription";

// Paiements (docs/system-design.md §3) : session Stripe Checkout et portail client. Les droits
// sont vérifiés ici ; l'achat n'est livré qu'à la confirmation de Stripe (webhook).

const checkoutSchema = z.object({
  locale: localeSchema,
  /** Page de retour d'un pack : crédits et formule, ou reprise de la génération. */
  returnTo: z.enum(["credits", "generation"]).default("credits"),
  item: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("pack"),
      product: z.enum(CREDIT_PACKS.map((pack) => pack.id)),
    }),
    z.object({ kind: z.literal("cvPro"), cvId: z.uuid() }),
    z.object({
      kind: z.literal("subscription"),
      tier: z.enum(PLAN_TIERS),
      interval: z.enum(BILLING_INTERVALS),
      trial: z.boolean().default(false),
    }),
  ]),
});

/** Adresse de retour ; `{CHECKOUT_SESSION_ID}` est remplacé par Stripe. */
function returnUrl(locale: AppLocale, item: CheckoutItem, returnTo: string) {
  const path =
    item.kind === "cvPro"
      ? `/${locale}/cv/${item.cvId}`
      : localizedPath(
          locale,
          item.kind === "pack" && returnTo === "generation"
            ? "/creer/generation"
            : "/compte/credits",
        );
  return `${env.NEXT_PUBLIC_SITE_URL}${path}`;
}

/** Client Stripe du compte, créé au premier achat. */
async function stripeCustomer(
  stripe: Stripe,
  user: CurrentUser,
  existing: string | null,
) {
  if (existing) return existing;
  const customer = await stripe.customers.create(
    { email: user.email, metadata: { user_id: user.id } },
    { idempotencyKey: `customer-${user.id}` },
  );
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);
  if (error) throw error;
  return customer.id;
}

export async function createCheckoutSession(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { locale, item, returnTo } = parsed.data;

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const [profile, subscription] = await Promise.all([
    getOwnProfile(await createClient(), user.id),
    getCurrentSubscription(),
  ]);

  // Un seul abonnement par compte (US-20 c.4), un seul essai (US-21 c.6).
  if (item.kind === "subscription") {
    if (subscription) return fail("CONFLICT", { reason: "subscribed" });
    if (item.trial && item.tier !== TRIAL.plan) {
      return fail("VALIDATION_ERROR");
    }
    if (item.trial && profile.trial_used_at) {
      return fail("CONFLICT", { reason: "trialUsed" });
    }
  }
  if (item.kind === "cvPro") {
    const cv = await getOwnCv(item.cvId);
    if (!cv) return fail("NOT_FOUND");
    if (cv.proUnlocked || subscription) {
      return fail("CONFLICT", { reason: "cvUnlocked" });
    }
  }

  const stripe = getStripe();
  if (!stripe) return fail("PAYMENT_ERROR");

  try {
    const t = await getTranslations({ locale, namespace: "billing" });
    const back = returnUrl(locale, item, returnTo);
    const session = await stripe.checkout.sessions.create(
      checkoutParams({
        item,
        priceId: await priceIdFor(stripe, checkoutLookupKey(item)),
        customerId: await stripeCustomer(
          stripe,
          user,
          profile.stripe_customer_id,
        ),
        userId: user.id,
        locale,
        successUrl: `${back}?paiement=ok${item.kind === "subscription" ? "&abonnement=1" : ""}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${back}?paiement=annule`,
        termsMessage: t("checkout.terms", {
          url: `${env.NEXT_PUBLIC_SITE_URL}${localizedPath(locale, "/cgv")}`,
        }),
      }),
    );
    if (!session.url) throw new Error("Session Stripe sans adresse");
    return ok({ url: session.url });
  } catch (error) {
    console.error(
      "Session de paiement impossible",
      error instanceof Error ? error.message : error,
    );
    return fail("PAYMENT_ERROR");
  }
}

/** Portail client Stripe : formule, moyen de paiement, factures, résiliation (US-22). */
export async function openBillingPortal(
  locale: unknown,
): Promise<ActionResult<{ url: string }>> {
  const parsedLocale = localeSchema.safeParse(locale);
  if (!parsedLocale.success) return validationError(parsedLocale.error);

  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const profile = await getOwnProfile(await createClient(), user.id);
  if (!profile.stripe_customer_id) return fail("NOT_FOUND");
  const stripe = getStripe();
  if (!stripe) return fail("PAYMENT_ERROR");

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      locale: parsedLocale.data,
      return_url: `${env.NEXT_PUBLIC_SITE_URL}${localizedPath(parsedLocale.data, "/compte/credits")}`,
    });
    return ok({ url: session.url });
  } catch (error) {
    console.error(
      "Portail de paiement impossible",
      error instanceof Error ? error.message : error,
    );
    return fail("PAYMENT_ERROR");
  }
}
