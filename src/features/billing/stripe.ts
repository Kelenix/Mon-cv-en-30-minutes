import "server-only";
import Stripe from "stripe";
import { env } from "@/core/env";

// Client Stripe unique (docs/architecture.md §8) : délai de 20 s, deux nouvelles tentatives
// (docs/system-design.md §9).

let client: Stripe | undefined;
const priceIds = new Map<string, string>();

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
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  const id = data[0]?.id;
  if (!id) throw new Error(`Prix Stripe introuvable : ${lookupKey}`);
  priceIds.set(lookupKey, id);
  return id;
}
