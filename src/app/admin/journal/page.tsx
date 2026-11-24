import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireAdmin } from "@/features/admin/access";
import { getAuditLog } from "@/features/admin/data";
import { formatDateTime } from "@/features/admin/format";
import { label } from "@/features/admin/labels";
import { DashboardSkeleton } from "@/features/admin/presentation/skeleton";
import {
  DataTable,
  Empty,
  PageHeader,
  Panel,
} from "@/features/admin/presentation/ui";

export const metadata: Metadata = { title: "Journal" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Journal d'administration"
        description="Chaque action sur un compte, avec son auteur ; gardé un an."
      />
      <Suspense fallback={<DashboardSkeleton tiles={0} />}>
        <Appear>
          <AuditLog />
        </Appear>
      </Suspense>
    </>
  );
}

function detailsOf(details: Record<string, unknown>) {
  const parts: string[] = [];
  if (typeof details.amount === "number")
    parts.push(`${details.amount} crédits`);
  if (typeof details.note === "string" && details.note)
    parts.push(details.note);
  return parts.join(" · ") || "–";
}

async function AuditLog() {
  await requireAdmin();
  const entries = await getAuditLog();

  return (
    <div className="mt-6">
      <Panel title="200 dernières actions">
        {entries.length === 0 ? (
          <Empty>Aucune action pour l&apos;instant.</Empty>
        ) : (
          <DataTable
            caption="Journal d'administration"
            head={["Date", "Action", "Compte", "Détails", "Par"]}
          >
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap">
                  {formatDateTime(entry.created_at)}
                </td>
                <td className="font-medium whitespace-nowrap">
                  {label("action", entry.action)}
                </td>
                <td>
                  {entry.target_user_id && entry.action !== "delete" ? (
                    <Link
                      href={`/admin/utilisateurs/${entry.target_user_id}`}
                      className="text-primary-strong underline-offset-4 hover:underline"
                    >
                      {entry.target_email ?? entry.target_user_id}
                    </Link>
                  ) : (
                    (entry.target_email ?? "–")
                  )}
                </td>
                <td>{detailsOf(entry.details)}</td>
                <td className="text-muted-foreground">{entry.admin_email}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
