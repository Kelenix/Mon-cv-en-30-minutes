import type { Metadata } from "next";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireAdmin } from "@/features/admin/access";
import { getDaily, getSummary, parsePeriod } from "@/features/admin/data";
import {
  formatDollars,
  formatDuration,
  formatNumber,
  formatShare,
} from "@/features/admin/format";
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

export const metadata: Metadata = { title: "Intelligence artificielle" };

export default function AiPage({ searchParams }: PageProps<"/admin/ia">) {
  return (
    <>
      <PageHeader
        title="Intelligence artificielle"
        description="Volume, fiabilité, durée et coût des opérations de Claude."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Appear>
          <AiStats searchParams={searchParams} />
        </Appear>
      </Suspense>
    </>
  );
}

async function AiStats({
  searchParams,
}: {
  searchParams: PageProps<"/admin/ia">["searchParams"];
}) {
  await requireAdmin();
  const days = parsePeriod((await searchParams).jours);
  const [summary, daily] = await Promise.all([
    getSummary(days),
    getDaily(days),
  ]);
  const kinds = summary.ai.byKind;
  const sum = (pick: (kind: (typeof kinds)[number]) => number) =>
    kinds.reduce((total, kind) => total + pick(kind), 0);
  const count = sum((kind) => kind.count);
  const failed = sum((kind) => kind.failed);
  const cost = sum((kind) => kind.costMicros);
  const succeeded = count - failed;
  const weightedMs = sum(
    (kind) => (kind.avgMs ?? 0) * (kind.count - kind.failed),
  );

  return (
    <div className="mt-6 grid gap-6">
      <PeriodTabs pathname="/admin/ia" current={days} />
      <StatGrid>
        <StatTile
          label="Opérations"
          value={formatNumber(count)}
          hint={`${formatNumber(sum((kind) => kind.free))} gratuites`}
        />
        <StatTile
          label="Taux de réussite"
          value={formatShare(succeeded, count)}
          hint={`${formatNumber(failed)} échecs, crédits rendus`}
        />
        <StatTile
          label="Durée moyenne"
          value={formatDuration(
            succeeded > 0 ? Math.round(weightedMs / succeeded) : null,
          )}
          hint="opérations réussies"
        />
        <StatTile
          label="Coût total"
          value={formatDollars(cost)}
          hint={
            count > 0
              ? `${formatDollars(cost / count)} par opération`
              : undefined
          }
        />
        <StatTile
          label="Tokens lus"
          value={formatNumber(sum((kind) => kind.inputTokens))}
          hint="en entrée"
        />
        <StatTile
          label="Tokens écrits"
          value={formatNumber(sum((kind) => kind.outputTokens))}
          hint="en sortie"
        />
        <StatTile
          label="CV créés"
          value={formatNumber(summary.content.cvsPeriod)}
          hint="sur la période"
        />
        <StatTile
          label="Contenus générés"
          value={formatNumber(
            summary.content.generationsByKind.reduce(
              (total, item) => total + item.count,
              0,
            ),
          )}
          hint="lettres, LinkedIn, entretiens…"
        />
      </StatGrid>

      <PanelGrid>
        <Panel title="Opérations par jour">
          <TimeChart
            data={daily}
            series={[
              { key: "ai_operations", label: "Opérations" },
              { key: "ai_failed", label: "Échecs" },
            ]}
          />
        </Panel>
        <Panel
          title="Coût par jour"
          description="Estimation d'après les tokens consommés"
        >
          <TimeChart
            data={daily}
            series={[{ key: "ai_cost_micros", label: "Coût" }]}
            format="dollars"
          />
        </Panel>
      </PanelGrid>

      <Panel title="Détail par opération">
        {kinds.length === 0 ? (
          <Empty>Aucune opération sur la période.</Empty>
        ) : (
          <DataTable
            caption="Opérations IA par type"
            head={[
              "Opération",
              "Nombre",
              "Gratuites",
              "Échecs",
              "Durée moyenne",
              "Coût",
              "Coût moyen",
            ]}
          >
            {kinds.map((kind) => (
              <tr key={kind.key}>
                <td className="font-medium">{label("aiKind", kind.key)}</td>
                <td className="tabular-nums">{formatNumber(kind.count)}</td>
                <td className="tabular-nums">{formatNumber(kind.free)}</td>
                <td className="tabular-nums">
                  {formatNumber(kind.failed)} (
                  {formatShare(kind.failed, kind.count)})
                </td>
                <td className="tabular-nums">{formatDuration(kind.avgMs)}</td>
                <td className="tabular-nums">
                  {formatDollars(kind.costMicros)}
                </td>
                <td className="tabular-nums">
                  {kind.count > 0
                    ? formatDollars(kind.costMicros / kind.count)
                    : "–"}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <PanelGrid>
        <Panel title="Causes des échecs">
          <BarList
            items={summary.ai.errors.map((item) => ({
              label: label("aiError", item.key),
              value: item.count,
              display: formatNumber(item.count),
            }))}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel title="Contenus générés par type">
          <BarList
            items={summary.content.generationsByKind.map((item) => ({
              label: label("generation", item.key),
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
