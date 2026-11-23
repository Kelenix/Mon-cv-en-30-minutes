// Crée ou met à jour, dans Stripe en MODE TEST, les produits, les prix (repérés par leur clé :
// `credits_15`, `pro_month`…) et le portail client (docs/architecture.md §8). Rejouable.
// Lancement : `npm run stripe:seed` (clé lue dans `.env.local`).

import { existsSync } from "node:fs";
import Stripe from "stripe";
import {
  ADS_REMOVAL_PRICE_CENTS,
  BILLING_INTERVALS,
  CREDIT_PACKS,
  CV_PRO_PRICE_CENTS,
  PLAN_TIERS,
  PLANS,
  subscriptionLookupKey,
} from "../src/features/plans/catalog.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const key = process.env.STRIPE_SECRET_KEY ?? "";
if (!key.startsWith("sk_test_")) {
  console.error(
    "STRIPE_SECRET_KEY doit être une clé de TEST (sk_test_…) : ce script ne touche jamais au mode réel.",
  );
  process.exit(1);
}
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const stripe = new Stripe(key);

type ProductSpec = {
  appKey: string;
  name: string;
  prices: { lookupKey: string; cents: number; interval?: "month" | "year" }[];
};

const PLAN_NAMES = { essential: "Essential", pro: "Pro", premium: "Premium" };

const PRODUCTS: ProductSpec[] = [
  ...CREDIT_PACKS.map((pack) => ({
    appKey: pack.id,
    name: `${pack.credits} crédits IA`,
    prices: [{ lookupKey: pack.id, cents: pack.priceCents }],
  })),
  {
    appKey: "cv_pro",
    name: "CV Pro",
    prices: [{ lookupKey: "cv_pro", cents: CV_PRO_PRICE_CENTS }],
  },
  {
    appKey: "ads_removal",
    name: "Suppression des publicités",
    prices: [{ lookupKey: "ads_removal", cents: ADS_REMOVAL_PRICE_CENTS }],
  },
  ...PLAN_TIERS.map((tier) => ({
    appKey: tier,
    name: `Formule ${PLAN_NAMES[tier]}`,
    prices: BILLING_INTERVALS.map((interval) => ({
      lookupKey: subscriptionLookupKey(tier, interval),
      cents:
        interval === "month"
          ? PLANS[tier].monthlyPriceCents
          : PLANS[tier].yearlyPriceCents,
      interval,
    })),
  })),
];

const existing = await stripe.products.list({ limit: 100, active: true });
const productIds: Record<string, string> = {};
const priceIds: Record<string, string> = {};

for (const spec of PRODUCTS) {
  const product =
    existing.data.find((item) => item.metadata.app_key === spec.appKey) ??
    (await stripe.products.create({
      name: spec.name,
      metadata: { app_key: spec.appKey },
    }));
  productIds[spec.appKey] = product.id;

  for (const price of spec.prices) {
    const { data } = await stripe.prices.list({
      lookup_keys: [price.lookupKey],
      active: true,
    });
    const current = data[0];
    if (
      current?.unit_amount === price.cents &&
      current.product === product.id
    ) {
      priceIds[price.lookupKey] = current.id;
      continue;
    }
    // Nouveau prix : la clé passe au nouveau prix, l'ancien reste valable pour les abonnés.
    const created = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: price.cents,
      tax_behavior: "inclusive",
      lookup_key: price.lookupKey,
      transfer_lookup_key: true,
      ...(price.interval ? { recurring: { interval: price.interval } } : {}),
    });
    priceIds[price.lookupKey] = created.id;
    console.log(`Prix ${price.lookupKey} : ${price.cents / 100} €`);
  }
}

// Portail : montée immédiate au prorata, descente et résiliation en fin de période (US-22).
const portal = {
  business_profile: {
    privacy_policy_url: `${site}/fr/confidentialite`,
    terms_of_service_url: `${site}/fr/cgv`,
  },
  default_return_url: `${site}/fr/compte/credits`,
  features: {
    customer_update: {
      enabled: true,
      allowed_updates: ["email" as const, "address" as const],
    },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end" as const,
      proration_behavior: "none" as const,
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price" as const],
      proration_behavior: "always_invoice" as const,
      products: PLAN_TIERS.map((tier) => ({
        product: productIds[tier],
        prices: BILLING_INTERVALS.map(
          (interval) => priceIds[subscriptionLookupKey(tier, interval)],
        ),
      })),
      schedule_at_period_end: {
        conditions: [
          { type: "decreasing_item_amount" as const },
          { type: "shortening_interval" as const },
        ],
      },
    },
  },
};

const { data: configurations } = await stripe.billingPortal.configurations.list(
  { is_default: true, limit: 1 },
);
if (configurations[0]) {
  await stripe.billingPortal.configurations.update(
    configurations[0].id,
    portal,
  );
} else {
  await stripe.billingPortal.configurations.create(portal);
}

console.log("Stripe (mode test) prêt : produits, prix et portail client.");
