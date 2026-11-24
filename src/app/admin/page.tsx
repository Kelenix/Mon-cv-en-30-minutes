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
import {
  formatDollars,
  formatEuros,
  formatNumber,
  formatShare,
} from "@/features/admin/format";
import { countryName, label } from "@/features/admin/labels";
import { BarList } from "@/features/admin/presentation/bar-list";
import { PeriodTabs } from "@/features/admin/presentation/period-tabs";
import { DashboardSkeleton } from "@/features/admin/presentation/skeleton";
import { TimeChart } from "@/features/admin/presentation/time-chart";
import {
  PageHeader,
  Panel,
  PanelGrid,
  StatGrid,
  StatTile,
} from "@/features/admin/presentation/ui";

export const metadata: Metadata = { title: "Vue d'ensemble" };

export default function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Comptes, revenus, IA et visites sur la période choisie."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Appear>
          <Overview searchParams={searchParams} />
        </Appear>
      </Suspense>
    </>
  );
}

async function Overview({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  await requireAdmin();
  const days = parsePeriod((await searchParams).jours);
  const [summary, daily] = await Promise.all([
    getSummary(days),
    getDaily(days),
  ]);
  const subscribers = subscriberCounts(summary);
  const aiCount = summary.ai.byKind.reduce(
    (total, kind) => total + kind.count,
    0,
  );
  const aiFailed = summary.ai.byKind.reduce(
    (total, kind) => total + kind.failed,
    0,
  );
  const aiCost = summary.ai.byKind.reduce(
    (total, kind) => total + kind.costMicros,
    0,
  );

  return (
    <div className="mt-6 grid gap-6">
      <PeriodTabs pathname="/admin" current={days} />
      <StatGrid>
        <StatTile
          label="Comptes"
          value={formatNumber(summary.users.total)}
          hint={`+${formatNumber(summary.users.new)} sur la période`}
        />
        <StatTile
          label="Actifs sur 30 jours"
          value={formatNumber(summary.users.active30)}
          hint={`${formatNumber(summary.users.active7)} sur 7 jours`}
        />
        <StatTile
          label="Abonnés payants"
          value={formatNumber(subscribers.active + subscribers.pastDue)}
          hint={`${formatNumber(subscribers.trialing)} en essai`}
        />
        <StatTile
          label="Revenu mensuel récurrent"
          value={formatEuros(monthlyRecurringRevenue(summary))}
          hint="abonnements, annuels ramenés au mois"
        />
        <StatTile
          label="Revenus de la période"
          value={formatEuros(summary.revenue.period)}
          hint={`${formatEuros(summary.revenue.month)} ce mois-ci`}
        />
        <StatTile
          label="CV créés"
          value={formatNumber(summary.content.cvsPeriod)}
          hint={`${formatNumber(summary.content.cvs)} au total`}
        />
        <StatTile
          label="Opérations IA"
          value={formatNumber(aiCount)}
          hint={`${formatShare(aiFailed, aiCount)} d'échecs`}
        />
        <StatTile
          label="Coût de l'IA"
          value={formatDollars(aiCost)}
          hint={
            aiCount > 0
              ? `${formatDollars(aiCost / aiCount)} par opération`
              : undefined
          }
        />
      </StatGrid>

      <PanelGrid>
        <Panel title="Inscriptions" description="Nouveaux comptes par jour">
          <TimeChart
            data={daily}
            series={[{ key: "signups", label: "Inscriptions" }]}
          />
        </Panel>
        <Panel
          title="Revenus"
          description="Achats et échéances d'abonnement par jour"
        >
          <TimeChart
            data={daily}
            series={[{ key: "revenue_cents", label: "Revenus" }]}
            format="euros"
          />
        </Panel>
        <Panel
          title="Opérations IA"
          description="Toutes les opérations et celles en échec"
        >
          <TimeChart
            data={daily}
            series={[
              { key: "ai_operations", label: "Opérations" },
              { key: "ai_failed", label: "Échecs" },
            ]}
          />
        </Panel>
        <Panel
          title="Visites"
          description="Arrivées sur le site par jour (hors robots)"
        >
          <TimeChart
            data={daily}
            series={[{ key: "visits", label: "Visites" }]}
          />
        </Panel>
        <Panel title="Revenus par produit">
          <BarList
            items={summary.revenue.byItem.map((item) => ({
              label: label("item", item.key),
              value: item.amount ?? 0,
              display: formatEuros(item.amount ?? 0),
            }))}
            formatOther={formatEuros}
          />
        </Panel>
        <Panel title="Provenance des visites">
          <BarList
            items={summary.audience.visitChannels.map((item) => ({
              label: label("channel", item.key),
              value: item.count,
              display: formatNumber(item.count),
            }))}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel title="Pays des nouveaux comptes">
          <BarList
            items={summary.audience.signupCountries.map((item) => ({
              label: countryName(item.key),
              value: item.count,
              display: formatNumber(item.count),
            }))}
            limit={6}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel title="Opérations IA par type">
          <BarList
            items={summary.ai.byKind.map((item) => ({
              label: label("aiKind", item.key),
              value: item.count,
              display: formatNumber(item.count),
            }))}
            formatOther={formatNumber}
          />
        </Panel>
      </PanelGrid>
    </div>
  );
}
