import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getCurrentSubscription } from "@/features/billing/subscription";
import { getCurrentWallet } from "@/features/credits/wallet";
import { createClient } from "@/lib/supabase/server";

/**
 * Solde et formule du compte connecté (docs/system-design.md §5), interrogés au retour d'un
 * paiement. `session_id` : indique si l'achat de cette session est déjà livré.
 */
export async function GET(request: NextRequest) {
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });

  const sessionId = request.nextUrl.searchParams.get("session_id");
  const [wallet, subscription, purchase] = await Promise.all([
    getCurrentWallet(),
    getCurrentSubscription(),
    sessionId
      ? (await createClient())
          .from("purchases")
          .select("id")
          .eq("stripe_checkout_session_id", sessionId)
          .maybeSingle()
      : null,
  ]);

  return Response.json(
    {
      included: wallet?.included ?? 0,
      purchased: wallet?.purchased ?? 0,
      plan: subscription?.plan ?? null,
      nextGrantAt: subscription?.nextCreditGrantAt ?? null,
      renewsAt: subscription?.currentPeriodEnd ?? null,
      purchaseConfirmed: Boolean(purchase?.data),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
