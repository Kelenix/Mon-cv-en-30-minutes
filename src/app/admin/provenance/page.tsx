import type { Metadata } from "next";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireAdmin } from "@/features/admin/access";
import {
  getAcquisition,
  getDaily,
  getSummary,
  parsePeriod,
} from "@/features/admin/data";
import {
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
  DataTable,
  Empty,
  PageHeader,
  Panel,
  PanelGrid,
  StatGrid,
  StatTile,
} from "@/features/admin/presentation/ui";

export const metadata: Metadata = { title: "Provenance" };

export default function AudiencePage({
  searchParams,
}: PageProps<"/admin/provenance">) {
  return (
    <>
      <PageHeader
        title="Provenance"
        description="D'où viennent les visiteurs, et ce que rapporte chaque source. Compteurs anonymes : ni adresse IP gardée, ni lien avec les comptes."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Appear>
          <Audience searchParams={searchParams} />
        </Appear>
      </Suspense>
    </>
  );
}

async function Audience({
  searchParams,
}: {
  searchParams: PageProps<"/admin/provenance">["searchParams"];
}) {
  await requireAdmin();
  const days = parsePeriod((await searchParams).jours);
  const [summary, daily, acquisition] = await Promise.all([
    getSummary(days),
    getDaily(days),
    getAcquisition(days),
  ]);
  const { audience } = summary;
  const visits = daily.reduce((total, day) => total + day.visits, 0);
  const signups = summary.users.new;
  const methods = audience.signupMethods;
  const counted = (
    items: { key: string; count: number }[],
    name: (key: string) => string,
  ) =>
    items.map((item) => ({
      label: name(item.key),
      value: item.count,
      display: formatNumber(item.count),
    }));

  return (
    <div className="mt-6 grid gap-6">
      <PeriodTabs pathname="/admin/provenance" current={days} />
      <StatGrid>
        <StatTile
          label="Visites"
          value={formatNumber(visits)}
          hint="arrivées sur le site, hors robots"
        />
        <StatTile
          label="Nouveaux comptes"
          value={formatNumber(signups)}
          hint="sur la période"
        />
        <StatTile
          label="Taux de conversion"
          value={formatShare(signups, visits)}
          hint="comptes créés par visite"
        />
        <StatTile
          label="Inscriptions avec Google"
          value={formatShare(methods.google, methods.google + methods.email)}
          hint={`${formatNumber(methods.email)} par code e-mail`}
        />
      </StatGrid>

      <Panel
        title="Ce que rapporte chaque source"
        description="Source de la première arrivée, gardée 30 jours : comptes, CV, essais et achats qui en découlent."
      >
        {acquisition.length === 0 ? (
          <Empty>Aucune visite sur la période.</Empty>
        ) : (
          <DataTable
            caption="Ce que rapporte chaque source"
            head={[
              "Source",
              "Canal",
              "Visites",
              "Comptes",
              "CV créés",
              "Essais",
              "Achats",
              "Revenus",
            ]}
          >
            {acquisition.map((row) => (
              <tr key={`${row.channel}-${row.source}`}>
                <td className="font-medium">{label("source", row.source)}</td>
                <td className="whitespace-nowrap">
                  {label("channel", row.channel)}
                </td>
                {[
                  row.visits,
                  row.signups,
                  row.cvs,
                  row.trials,
                  row.purchases,
                ].map((value, index) => (
                  <td key={index} className="tabular-nums">
                    {formatNumber(value)}
                  </td>
                ))}
                <td className="tabular-nums">
                  {formatEuros(row.revenue_cents)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <PanelGrid>
        <Panel title="Visites par jour">
          <TimeChart
            data={daily}
            series={[{ key: "visits", label: "Visites" }]}
          />
        </Panel>
        <Panel title="Nouveaux comptes par jour">
          <TimeChart
            data={daily}
            series={[{ key: "signups", label: "Inscriptions" }]}
          />
        </Panel>
        <Panel title="Canaux d'arrivée">
          <BarList
            items={counted(audience.visitChannels, (key) =>
              label("channel", key),
            )}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel
          title="Principales sources"
          description="Moteurs, réseaux, sites et campagnes (utm_source)"
        >
          <BarList
            items={counted(audience.visitSources, (key) =>
              label("source", key),
            )}
            limit={10}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel title="Pays des visiteurs">
          <BarList
            items={counted(audience.visitCountries, countryName)}
            limit={10}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel title="Pays des nouveaux comptes">
          <BarList
            items={counted(audience.signupCountries, countryName)}
            limit={10}
            formatOther={formatNumber}
          />
        </Panel>
        <Panel title="Langue des nouveaux comptes">
          <BarList
            items={counted(audience.signupLocales, (key) =>
              label("locale", key),
            )}
            formatOther={formatNumber}
          />
        </Panel>
      </PanelGrid>
      <p className="text-sm text-muted-foreground">
        Pays déduits de l&apos;adresse IP avec la base{" "}
        <a
          href="https://db-ip.com"
          className="underline underline-offset-4"
          rel="noreferrer"
          target="_blank"
        >
          IP Geolocation by DB-IP
        </a>{" "}
        (licence CC BY 4.0) ; l&apos;adresse n&apos;est jamais enregistrée.
      </p>
    </div>
  );
}
