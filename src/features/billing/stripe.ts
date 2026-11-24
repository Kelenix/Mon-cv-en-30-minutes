import "server-only";
import Stripe from "stripe";
import { env } from "@/core/env";
import { STRIPE_APP, stripeLookupKey } from "@/features/plans/catalog";

// Client Stripe unique (docs/architecture.md §8) : délai de 20 s, deux nouvelles tentatives
// (docs/system-design.md §9). Le compte Stripe est partagé avec d'autres produits (ADR-042) :
// prix et portail sont ceux marqués pour l'application.

let client: Stripe | undefined;
const priceIds = new Map<string, string>();
let portalConfigurationId: string | undefined;

/** Client de l'API, ou `null` sans clé : le paiement est alors indisponible (tâche manuelle 4). */
export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
  return client;
}

/** Prix désigné par sa clé (créé par `npm run stripe:seed`), gardé en mémoire. */
export async function priceIdFor(stripe: Stripe, lookupKey: string) {
  const cached = priceIds.get(lookupKey);
  if (cached) return cached;
  const { data } = await stripe.prices.list({
    lookup_keys: [stripeLookupKey(lookupKey)],
    active: true,
    limit: 1,
  });
  const id = data[0]?.id;
  if (!id) throw new Error(`Prix Stripe introuvable : ${lookupKey}`);
  priceIds.set(lookupKey, id);
  return id;
}

/** Portail client de l'application (créé par `npm run stripe:seed`), gardé en mémoire. */
export async function portalConfigurationFor(stripe: Stripe) {
  if (portalConfigurationId) return portalConfigurationId;
  for await (const configuration of stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  })) {
    if (configuration.metadata?.app === STRIPE_APP) {
      portalConfigurationId = configuration.id;
      return configuration.id;
    }
  }
  throw new Error("Portail client Stripe introuvable : npm run stripe:seed");
}
