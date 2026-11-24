import { timingSafeEqual } from "node:crypto";
import { env } from "@/core/env";
import { runRetention } from "@/features/retention/run-retention";

function isAuthorized(header: string | null) {
  if (!env.CRON_SECRET || !header) return false;
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const received = Buffer.from(header);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

/**
 * Tâche quotidienne de rétention des comptes (US-40), lancée par le planificateur du serveur
 * depuis le conteneur du site (deploy/scripts/cron-retention.sh) ; adresse fermée au public par
 * le proxy et protégée par `CRON_SECRET`.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return new Response(null, { status: 401 });
  }
  const report = await runRetention();
  console.info("Rétention des comptes", report);
  return Response.json(report);
}
