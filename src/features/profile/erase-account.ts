import "server-only";
import { getStripe } from "@/features/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Résilie immédiatement tout abonnement en supprimant le client Stripe (US-06 c.2) ; seules les
 * factures restent chez Stripe (obligation légale). Faux si Stripe n'a pas pu le faire.
 */
async function deleteStripeCustomer(customerId: string | null) {
  if (!customerId) return true;
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    await stripe.customers.del(customerId);
    return true;
  } catch (error) {
    // Client déjà supprimé chez Stripe : rien à résilier.
    if ((error as { code?: string }).code === "resource_missing") return true;
    console.error("Résiliation Stripe impossible", (error as Error).message);
    return false;
  }
}

/**
 * Suppression définitive d'un compte, à sa demande (US-06) ou après trois ans d'inactivité
 * (US-40) : abonnement résilié, puis compte d'authentification supprimé, et avec lui, en
 * cascade, toutes les données de l'utilisateur.
 */
export async function eraseAccount(
  userId: string,
  stripeCustomerId: string | null,
): Promise<"ok" | "PAYMENT_ERROR" | "INTERNAL"> {
  if (!(await deleteStripeCustomer(stripeCustomerId))) return "PAYMENT_ERROR";
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) {
    console.error("Suppression du compte impossible", error.code);
    return "INTERNAL";
  }
  return "ok";
}
