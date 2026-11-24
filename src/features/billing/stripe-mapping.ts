import type Stripe from "stripe";
import {
  type BillingInterval,
  type CreditPackId,
  parseSubscriptionLookupKey,
  type PlanTier,
  PLANS,
  STRIPE_APP,
  subscriptionLookupKey,
  TRIAL,
} from "@/features/plans/catalog";
import type { AppLocale } from "@/i18n/routing";

// Correspondances entre l'application et Stripe : paramètres d'une session de paiement et état
// d'un abonnement. Logique pure, testée unitairement.

export type CheckoutItem =
  | { kind: "pack"; product: CreditPackId }
  | { kind: "cvPro"; cvId: string }
  | { kind: "adsRemoval" }
  | {
      kind: "subscription";
      tier: PlanTier;
      interval: BillingInterval;
      trial: boolean;
    };

/** Page de retour après le paiement d'un pack : crédits, génération, ou un CV. */
export type ReturnTo = "credits" | "generation" | { cvId: string };

export function checkoutLookupKey(item: CheckoutItem) {
  if (item.kind === "pack") return item.product;
  if (item.kind === "cvPro") return "cv_pro";
  if (item.kind === "adsRemoval") return "ads_removal";
  return subscriptionLookupKey(item.tier, item.interval);
}

/**
 * Session Stripe Checkout (US-18 à US-21) : client Stripe du compte, langue de l'interface,
 * acceptation obligatoire des conditions avec renonciation au droit de rétractation, et
 * métadonnées que le webhook relit pour livrer l'achat.
 */
export function checkoutParams({
  item,
  priceId,
  customerId,
  userId,
  locale,
  successUrl,
  cancelUrl,
  termsMessage,
}: {
  item: CheckoutItem;
  priceId: string;
  customerId: string;
  userId: string;
  locale: AppLocale;
  successUrl: string;
  cancelUrl: string;
  termsMessage: string;
}): Stripe.Checkout.SessionCreateParams {
  const common = {
    customer: customerId,
    client_reference_id: userId,
    locale,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    consent_collection: { terms_of_service: "required" as const },
    custom_text: { terms_of_service_acceptance: { message: termsMessage } },
  };

  if (item.kind === "subscription") {
    return {
      ...common,
      mode: "subscription",
      metadata: { app: STRIPE_APP, user_id: userId },
      subscription_data: {
        metadata: { user_id: userId },
        ...(item.trial ? { trial_period_days: TRIAL.days } : {}),
      },
    };
  }
  return {
    ...common,
    mode: "payment",
    invoice_creation: { enabled: true },
    metadata: {
      app: STRIPE_APP,
      user_id: userId,
      product: checkoutLookupKey(item),
      ...(item.kind === "cvPro" ? { cv_id: item.cvId } : {}),
    },
  };
}

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString();

/** États connus de la base (miroir de Stripe) ; un état inconnu n'est pas enregistré. */
const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
] as const;
type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Abonnement à une formule de l'application, et non à un autre produit du compte Stripe. */
export function isAppSubscription(subscription: Stripe.Subscription) {
  return subscription.items.data.some(
    (item) => parseSubscriptionLookupKey(item.price.lookup_key) !== null,
  );
}

/** Arguments de `sync_subscription` à partir d'un abonnement relu chez Stripe. */
export function subscriptionState(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const plan = parseSubscriptionLookupKey(item?.price.lookup_key);
  const status = subscription.status as SubscriptionStatus;
  if (!item || !plan || !SUBSCRIPTION_STATUSES.includes(status)) return null;

  return {
    p_provider_subscription_id: subscription.id,
    p_plan: plan.tier,
    p_interval: plan.interval,
    p_status: status,
    p_monthly_credits: PLANS[plan.tier].monthlyCredits,
    p_trial_credits: TRIAL.credits,
    p_current_period_end: toIso(item.current_period_end),
    p_cancel_at_period_end:
      subscription.cancel_at_period_end || subscription.cancel_at !== null,
    p_trial_ends_at: subscription.trial_end
      ? toIso(subscription.trial_end)
      : undefined,
  };
}

/** Identifiant du client Stripe, que l'objet soit développé ou non. */
export function customerIdOf(
  customer: string | { id: string } | null | undefined,
) {
  return typeof customer === "string" ? customer : (customer?.id ?? null);
}

/**
 * Moyen de paiement pour les statistiques (ADR-040) : portefeuille d'une carte (Apple Pay,
 * Google Pay, Link…), sinon le type Stripe (`card`, `paypal`, `sepa_debit`…). `null` si le
 * moyen n'est pas développé dans la réponse.
 */
export function paymentMethodLabel(
  method: string | Stripe.PaymentMethod | null | undefined,
) {
  if (!method || typeof method === "string") return null;
  if (method.type === "card") return method.card?.wallet?.type ?? "card";
  return method.type;
}
