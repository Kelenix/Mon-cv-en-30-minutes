import { timingSafeEqual } from "node:crypto";
import { env } from "@/core/env";
import { runRetention } from "@/features/retention/run-retention";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorized(header: string | null) {
  if (!env.CRON_SECRET || !header) return false;
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const received = Buffer.from(header);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

/** Trace de l'exécution, affichée dans l'état du système de l'administration (ADR-040). */
async function logRun(ok: boolean, details: Record<string, unknown>) {
  const { error } = await createAdminClient()
    .from("job_runs")
    .insert({ job: "retention", ok, details: details as never });
  if (error) console.error("Exécution de la rétention non tracée", error.code);
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
  try {
    const report = await runRetention();
    console.info("Rétention des comptes", report);
    await logRun(report.failed === 0, report);
    return Response.json(report);
  } catch (error) {
    await logRun(false, { error: (error as Error).message });
    throw error;
  }
}
