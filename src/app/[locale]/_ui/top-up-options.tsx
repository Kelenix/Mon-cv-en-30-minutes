import { getAdsAudience } from "@/features/ads/audience";
import { RewardedVideo } from "@/features/ads/presentation/rewarded-video";
import { CreditPackButtons } from "@/features/billing/presentation/offers";
import type { ReturnTo } from "@/features/billing/stripe-mapping";

/**
 * Recharge proposée dans « Solde insuffisant » et les crédits : packs (US-18) et, pour un compte
 * sans abonnement, une annonce contre 1 crédit (US-35 c.1, H26).
 */
export async function TopUpOptions({
  returnTo,
  stacked,
}: {
  returnTo?: ReturnTo;
  stacked?: boolean;
}) {
  const { config, rewarded } = await getAdsAudience();
  return (
    <div className="grid gap-4">
      <CreditPackButtons returnTo={returnTo} stacked={stacked} />
      {config && rewarded ? <RewardedVideo config={config} /> : null}
    </div>
  );
}
