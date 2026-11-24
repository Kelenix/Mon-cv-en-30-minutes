import "server-only";
import { env } from "@/core/env";
import { localizedPath } from "@/features/auth/paths";
import { eraseAccount } from "@/features/profile/erase-account";
import { sendEmail } from "@/lib/mailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { retentionWarningEmail } from "./warning-email";

// Comptes traités par passage : la suite l'est le lendemain, toujours avec 30 jours de préavis,
// et le volume d'e-mails reste sous les quotas quotidiens des fournisseurs SMTP.
const BATCH = 200;
const NOTICE_MS = 30 * 86_400_000;

export type RetentionReport = {
  warned: number;
  deleted: number;
  failed: number;
};

/**
 * Tâche quotidienne de rétention (US-40) : supprime les comptes avertis depuis 30 jours et
 * toujours inactifs, puis avertit ceux qui atteignent 3 ans d'inactivité moins 30 jours. Les
 * comptes abonnés sont exclus par la base. Rejouable : un compte n'est averti qu'une fois, sauf si
 * l'envoi échoue (nouvel essai le lendemain).
 */
export async function runRetention(): Promise<RetentionReport> {
  const admin = createAdminClient();
  const report: RetentionReport = { warned: 0, deleted: 0, failed: 0 };

  const { data: due, error: dueError } = await admin.rpc(
    "retention_deletions_due",
    { p_limit: BATCH },
  );
  if (dueError) throw dueError;
  for (const account of due) {
    const result = await eraseAccount(
      account.user_id,
      account.stripe_customer_id,
    );
    report[result === "ok" ? "deleted" : "failed"] += 1;
  }

  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_retention_warnings",
    { p_limit: BATCH },
  );
  if (claimError) throw claimError;
  const deletionDate = new Date(Date.now() + NOTICE_MS);
  for (const account of claimed) {
    try {
      await sendEmail({
        to: account.email,
        ...retentionWarningEmail({
          locale: account.locale,
          firstName: account.first_name,
          deletionDate,
          signInUrl: `${env.NEXT_PUBLIC_SITE_URL}${localizedPath(account.locale, "/connexion")}`,
        }),
      });
      report.warned += 1;
    } catch (error) {
      report.failed += 1;
      console.error(
        "Avertissement de suppression non envoyé",
        (error as Error).message,
      );
      await admin
        .from("profiles")
        .update({ retention_warning_sent_at: null })
        .eq("id", account.user_id);
    }
  }

  return report;
}
