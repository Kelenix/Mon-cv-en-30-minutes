import "server-only";
import type Stripe from "stripe";
import {
  PURCHASE_PRODUCTS,
  type PurchaseProduct,
  productCredits,
} from "@/features/plans/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerIdOf, subscriptionState } from "./stripe-mapping";

// Traitement des événements Stripe (docs/system-design.md §6.2 et §6.3) : chaque événement n'est
// traité qu'une fois ; l'abonnement est relu chez Stripe, donc l'ordre d'arrivée est
// indifférent ; les écritures passent par les fonctions SQL réservées au serveur.

type Admin = ReturnType<typeof createAdminClient>;

/** Compte supprimé entre-temps : l'événement est ignoré (sinon Stripe réessaierait 3 jours). */
const DELETED_ACCOUNT_ERRORS = new Set(["WALLET_NOT_FOUND"]);
const FOREIGN_KEY_VIOLATION = "23503";

function isPurchaseProduct(value: unknown): value is PurchaseProduct {
  return PURCHASE_PRODUCTS.includes(value as PurchaseProduct);
}

function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (
    DELETED_ACCOUNT_ERRORS.has(error.message) ||
    error.code === FOREIGN_KEY_VIOLATION
  ) {
    console.warn("Événement Stripe d'un compte supprimé, ignoré");
    return;
  }
  throw new Error(error.message);
}

async function userIdForCustomer(admin: Admin, customerId: string | null) {
  if (!customerId) return null;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function syncSubscription(admin: Admin, stripe: Stripe, id: string) {
  const subscription = await stripe.subscriptions.retrieve(id);
  const state = subscriptionState(subscription);
  if (!state) throw new Error(`Abonnement sans formule connue : ${id}`);

  const userId =
    subscription.metadata.user_id ||
    (await userIdForCustomer(admin, customerIdOf(subscription.customer)));
  if (!userId) {
    console.warn("Abonnement Stripe sans compte associé, ignoré");
    return;
  }
  const { error } = await admin.rpc("sync_subscription", {
    p_user_id: userId,
    ...state,
  });
  check(error);
}

async function completeCheckout(
  admin: Admin,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  confirmedAt: number,
) {
  if (session.mode === "subscription") {
    const id = customerIdOf(session.subscription);
    if (id) await syncSubscription(admin, stripe, id);
    return;
  }
  // Paiement différé (virement…) : livré à l'événement `async_payment_succeeded`.
  if (session.payment_status !== "paid") return;

  const { user_id: userId, product, cv_id: cvId } = session.metadata ?? {};
  if (!userId || !isPurchaseProduct(product)) {
    throw new Error(`Session de paiement sans métadonnées : ${session.id}`);
  }
  const { error } = await admin.rpc("fulfill_purchase", {
    p_user_id: userId,
    p_product: product,
    p_session_id: session.id,
    p_amount_cents: session.amount_total ?? 0,
    p_currency: session.currency ?? "eur",
    // Conditions et renonciation acceptées : obligatoires pour valider le paiement.
    p_terms_accepted_at: new Date(confirmedAt * 1000).toISOString(),
    p_credits: productCredits(product),
    p_cv_id: cvId || undefined,
  });
  check(error);
}

export async function handleStripeEvent(stripe: Stripe, event: Stripe.Event) {
  const admin = createAdminClient();
  const { data: seen } = await admin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (seen) return;

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await completeCheckout(admin, stripe, event.data.object, event.created);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await syncSubscription(admin, stripe, event.data.object.id);
      break;
  }

  // Noté après traitement : un échec laisse Stripe réessayer (traitements idempotents).
  const { error } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (error && error.code !== "23505") throw new Error(error.message);
}
