import { env } from "@/core/env";
import { getStripe } from "@/features/billing/stripe";
import { handleStripeEvent } from "@/features/billing/webhook";

/**
 * Webhooks Stripe (docs/architecture.md §8) : signature vérifiée sur le corps brut ; réponse 500
 * en cas d'erreur pour que Stripe réessaie (traitements idempotents).
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response(null, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response(null, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    await handleStripeEvent(stripe, event);
  } catch (error) {
    console.error(
      "Webhook Stripe non traité",
      event.type,
      error instanceof Error ? error.message : error,
    );
    return new Response(null, { status: 500 });
  }
  return Response.json({ received: true });
}
