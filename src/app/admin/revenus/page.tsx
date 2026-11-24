import type { Metadata } from "next";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireAdmin } from "@/features/admin/access";
import {
  getDaily,
  getSummary,
  monthlyRecurringRevenue,
  parsePeriod,
  subscriberCounts,
} from "@/features/admin/data";
import { formatEuros, formatNumber } from "@/features/admin/format";
import { label } from "@/features/admin/labels";
import { BarList } from "@/features/admin/presentation/bar-list";
import { PeriodTabs } from "@/features/admin/presentation/period-tabs";
import { DashboardSkeleton } from "@/features/admin/presentation/skeleton";
import { TimeChart } from "@/features/admin/presentation/time-chart";
import {
  DataTable,
  Empty,
  PageHeader,
  Panel,
  PanelGrid,
  StatGrid,
  StatTile,
} from "@/features/admin/presentation/ui";

export const metadata: Metadata = { title: "Revenus et paiements" };

export default function RevenuePage({
  searchParams,
}: PageProps<"/admin/revenus">) {
  return (
    <>
      <PageHeader
        title="Revenus et paiements"
        description="Achats, abonnements, moyens de paiement et économie des crédits. Stripe reste la référence comptable."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Appear>
          <Revenue searchParams={searchParams} />
        </Appear>
      </Suspense>
    </>
  );
}

async function Revenue({
  searchParams,
}: {
  searchParams: PageProps<"/admin/revenus">["searchParams"];
}) {
  await requireAdmin();
  const days = parsePeriod((await searchParams).jours);
  const [summary, daily] = await Promise.all([
    getSummary(days),
    getDaily(days),
  ]);
  const mrr = monthlyRecurringRevenue(summary);
  const subscribers = subscriberCounts(summary);
  const { revenue, credits } = summary;

  return (
    <div className="mt-6 grid gap-6">
      <PeriodTabs pathname="/admin/revenus" current={days} />
      <StatGrid>
        <StatTile
          label="Revenus de la période"
          value={formatEuros(revenue.period)}
          hint={`${formatNumber(revenue.payments)} paiements`}
        />
        <StatTile
          label="Panier moyen"
          value={
            revenue.payments > 0
              ? formatEuros(Math.round(revenue.period / revenue.payments))
              : "–"
          }
          hint="par paiement sur la période"
        />
        <StatTile
          label="Ce mois-ci"
          value={formatEuros(revenue.month)}
          hint={`${formatEuros(revenue.total)} depuis le lancement`}
        />
        <StatTile
          label="Revenu mensuel récurrent"
          value={formatEuros(mrr)}
          hint={`${formatEuros(mrr * 12)} par an`}
        />
        <StatTile
          label="Abonnés payants"
          value={formatNumber(subscribers.active)}
          hint={`${formatNumber(subscribers.pastDue)} en retard de paiement`}
        />
        <StatTile
          label="Essais en cours"
          value={formatNumber(subscribers.trialing)}
          hint="Pro gratuit 3 jours"
        />
        <StatTile
          label="Résiliations"
          value={formatNumber(summary.subscriptions.canceled)}
          hint="sur la période"
        />
        <StatTile
          label="Publicités retirées"
          value={formatNumber(summary.users.adsRemoved)}
          hint="comptes au total"
        />
      </StatGrid>

      <Panel
        title="Revenus par jour"
        description="Achats et échéances d'abonnement"
      >
        <TimeChart
          data={daily}
          series={[{ key: "revenue_cents", label: "Revenus" }]}
          format="euros"
          height={280}
        />
      </Panel>

      <PanelGrid>
        <Panel title="Revenus par produit">
          <BarList
            items={revenue.byItem.map((item) => ({
              label: label("item", item.key),
              value: item.amount ?? 0,
              display: formatEuros(item.amount ?? 0),
            }))}
            formatOther={formatEuros}
          />
        </Panel>
        <Panel
          title="Moyens de paiement"
          description="Nombre de paiements ; montant en clair dans le tableau"
        >
          <BarList
            items={revenue.byMethod.map((item) => ({
              label: label("method", item.key),
              value: item.count,
              display: `${formatNumber(item.count)} · ${formatEuros(item.amount ?? 0)}`,
            }))}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel
          title="Abonnements en cours"
          description="Par formule, périodicité et état"
        >
          {summary.subscriptions.byPlan.length === 0 ? (
            <Empty>Aucun abonnement en cours.</Empty>
          ) : (
            <DataTable
              caption="Abonnements en cours"
              head={["Formule", "Périodicité", "État", "Comptes"]}
            >
              {summary.subscriptions.byPlan.map((row) => (
                <tr key={`${row.plan}-${row.interval}-${row.status}`}>
                  <td className="font-medium">{label("plan", row.plan)}</td>
                  <td>{label("interval", row.interval)}</td>
                  <td>{label("status", row.status)}</td>
                  <td className="tabular-nums">{formatNumber(row.count)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
        <Panel
          title="Économie des crédits"
          description={`${formatNumber(credits.included + credits.purchased)} crédits sur les comptes (${formatNumber(credits.included)} inclus, ${formatNumber(credits.purchased)} achetés)`}
        >
          {credits.byReason.length === 0 ? (
            <Empty>Aucun mouvement sur la période.</Empty>
          ) : (
            <DataTable
              caption="Mouvements de crédits par motif"
              head={["Motif", "Mouvements", "Crédits"]}
            >
              {credits.byReason.map((row) => (
                <tr key={row.key}>
                  <td className="font-medium">{label("reason", row.key)}</td>
                  <td className="tabular-nums">{formatNumber(row.count)}</td>
                  <td className="tabular-nums">
                    {row.credits > 0 ? "+" : ""}
                    {formatNumber(row.credits)}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </PanelGrid>
    </div>
  );
}
