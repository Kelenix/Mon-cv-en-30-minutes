import { getAdsAudience } from "../audience";
import { AdSlot } from "./ad-slot";

/**
 * Emplacement placé par une page autorisée (accueil, historique, US-33 c.1) : rien du tout, ni
 * script, pour un abonné ou un acheteur du retrait des publicités (c.4).
 */
export async function AdBanner({
  format,
  className,
}: {
  format: "banner" | "native";
  className?: string;
}) {
  const { config, display } = await getAdsAudience();
  if (!config || !display) return null;
  return <AdSlot config={config} format={format} className={className} />;
}
