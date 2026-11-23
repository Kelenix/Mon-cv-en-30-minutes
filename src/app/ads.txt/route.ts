import { env } from "@/core/env";

// ads.txt (IAB) : déclare Google comme seul vendeur autorisé des annonces du site, condition pour
// être payé (tâche manuelle 10). Vide tant que les publicités Google ne sont pas activées.
export function GET() {
  const body =
    env.ADS_MODE === "google" && env.ADS_PUBLISHER_ID
      ? `google.com, ${env.ADS_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`
      : "";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
