import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  checkoutLookupKey,
  checkoutParams,
  customerIdOf,
  subscriptionState,
} from "@/features/billing/stripe-mapping";
import {
  parseSubscriptionLookupKey,
  productCredits,
  purchasePriceCents,
  subscriptionLookupKey,
} from "@/features/plans/catalog";

// Correspondances avec Stripe (Inc-6) : paramètres de paiement, état d'un abonnement, prix.

const BASE = {
  priceId: "price_123",
  customerId: "cus_123",
  userId: "user-1",
  locale: "fr" as const,
  successUrl: "https://site.test/ok",
  cancelUrl: "https://site.test/annule",
  termsMessage: "J'accepte les CGV et je renonce à mon droit de rétractation.",
};

describe("catalogue des prix Stripe", () => {
  it("désigne chaque prix par une clé lisible", () => {
    expect(subscriptionLookupKey("pro", "year")).toBe("pro_year");
    expect(parseSubscriptionLookupKey("premium_month")).toEqual({
      tier: "premium",
      interval: "month",
    });
    expect(parseSubscriptionLookupKey("credits_5")).toBeNull();
    expect(parseSubscriptionLookupKey(null)).toBeNull();
  });

  it("donne crédits et prix de chaque produit", () => {
    expect(productCredits("credits_40")).toBe(40);
    expect(productCredits("cv_pro")).toBe(0);
    expect(purchasePriceCents("credits_15")).toBe(699);
    expect(purchasePriceCents("cv_pro")).toBe(499);
  });
});

describe("session de paiement", () => {
  it("pack : paiement unique, conditions obligatoires, métadonnées pour le webhook (US-18)", () => {
    const params = checkoutParams({
      ...BASE,
      item: { kind: "pack", product: "credits_15" },
    });
    expect(params).toMatchObject({
      mode: "payment",
      customer: "cus_123",
      locale: "fr",
      line_items: [{ price: "price_123", quantity: 1 }],
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: { message: BASE.termsMessage },
      },
      metadata: { user_id: "user-1", product: "credits_15" },
      invoice_creation: { enabled: true },
    });
  });

  it("CV Pro : le CV débloqué est transmis (US-19)", () => {
    const item = { kind: "cvPro" as const, cvId: "cv-1" };
    expect(checkoutLookupKey(item)).toBe("cv_pro");
    expect(checkoutParams({ ...BASE, item }).metadata).toEqual({
      user_id: "user-1",
      product: "cv_pro",
      cv_id: "cv-1",
    });
  });

  it("formule : abonnement, avec 3 jours d'essai seulement si demandé (US-20, US-21)", () => {
    const item = {
      kind: "subscription" as const,
      tier: "pro" as const,
      interval: "month" as const,
      trial: true,
    };
    expect(checkoutLookupKey(item)).toBe("pro_month");
    expect(checkoutParams({ ...BASE, item })).toMatchObject({
      mode: "subscription",
      subscription_data: {
        metadata: { user_id: "user-1" },
        trial_period_days: 3,
      },
    });
    const noTrial = checkoutParams({
      ...BASE,
      item: { ...item, trial: false },
    });
    expect(noTrial.subscription_data).toEqual({
      metadata: { user_id: "user-1" },
    });
  });
});

function subscription(
  overrides: Partial<Stripe.Subscription> = {},
  lookupKey = "pro_month",
) {
  return {
    id: "sub_1",
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null,
    trial_end: null,
    customer: "cus_1",
    metadata: {},
    items: {
      data: [
        { current_period_end: 1_800_000_000, price: { lookup_key: lookupKey } },
      ],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("état d'un abonnement relu chez Stripe", () => {
  it("donne formule, quota, fin de période et fin d'essai", () => {
    expect(
      subscriptionState(
        subscription({ status: "trialing", trial_end: 1_700_000_000 }),
      ),
    ).toEqual({
      p_provider_subscription_id: "sub_1",
      p_plan: "pro",
      p_interval: "month",
      p_status: "trialing",
      p_monthly_credits: 60,
      p_trial_credits: 10,
      p_current_period_end: new Date(1_800_000_000_000).toISOString(),
      p_cancel_at_period_end: false,
      p_trial_ends_at: new Date(1_700_000_000_000).toISOString(),
    });
  });

  it("note une résiliation programmée", () => {
    expect(
      subscriptionState(subscription({ cancel_at_period_end: true }))
        ?.p_cancel_at_period_end,
    ).toBe(true);
    expect(
      subscriptionState(subscription({ cancel_at: 1_800_000_000 }))
        ?.p_cancel_at_period_end,
    ).toBe(true);
  });

  it("ignore un prix ou un état inconnus", () => {
    expect(subscriptionState(subscription({}, "gold_week"))).toBeNull();
    expect(
      subscriptionState(
        subscription({ status: "unknown" as Stripe.Subscription.Status }),
      ),
    ).toBeNull();
  });

  it("lit l'identifiant du client, développé ou non", () => {
    expect(customerIdOf("cus_1")).toBe("cus_1");
    expect(customerIdOf({ id: "cus_2" })).toBe("cus_2");
    expect(customerIdOf(null)).toBeNull();
  });
});

describe("signature des webhooks", () => {
  const stripe = new Stripe("sk_test_unit");
  const secret = "whsec_test_unit";
  const payload = JSON.stringify({ id: "evt_1", type: "ping", data: {} });

  it("accepte un événement signé par Stripe", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe(
      "evt_1",
    );
  });

  it("refuse un événement modifié ou mal signé", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    expect(() =>
      stripe.webhooks.constructEvent(
        payload.replace("ping", "pong"),
        header,
        secret,
      ),
    ).toThrow();
    expect(() =>
      stripe.webhooks.constructEvent(payload, header, "whsec_autre"),
    ).toThrow();
  });
});
