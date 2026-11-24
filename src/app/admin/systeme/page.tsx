import type { Metadata } from "next";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireAdmin } from "@/features/admin/access";
import { getSystemData } from "@/features/admin/data";
import {
  formatBytes,
  formatDateTime,
  formatDecimal,
  formatNumber,
  formatRelative,
  formatShare,
} from "@/features/admin/format";
import { DashboardSkeleton } from "@/features/admin/presentation/skeleton";
import { StatusBadge } from "@/features/admin/presentation/status-badge";
import {
  DataTable,
  Empty,
  PageHeader,
  Panel,
  PanelGrid,
  StatGrid,
  StatTile,
} from "@/features/admin/presentation/ui";
import {
  backupStatus,
  type CheckState,
  serverStatus,
  serviceChecks,
} from "@/features/admin/system";

export const metadata: Metadata = { title: "État du système" };

const DAY_MS = 86_400_000;

export default function SystemPage() {
  return (
    <>
      <PageHeader
        title="État du système"
        description="Services interrogés en direct à l'ouverture de la page ; aucun secret n'est affiché."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Appear>
          <SystemStatus />
        </Appear>
      </Suspense>
    </>
  );
}

function ageState(at: string | null, maxDays: number, now: string): CheckState {
  if (!at) return "warning";
  return new Date(now).getTime() - new Date(at).getTime() > maxDays * DAY_MS
    ? "warning"
    : "ok";
}

async function SystemStatus() {
  await requireAdmin();
  const [checks, data, backups, server] = await Promise.all([
    serviceChecks(),
    getSystemData(),
    backupStatus(),
    serverStatus(),
  ]);
  const retention = data.jobRuns.find((run) => run.job === "retention");
  const usedMemory = server.memory.total - server.memory.free;
  const usedDisk = server.disk ? server.disk.total - server.disk.free : 0;
  const failing = checks.filter((check) => check.state === "error").length;

  return (
    <div className="mt-6 grid gap-6">
      <StatGrid>
        <StatTile
          label="Services opérationnels"
          value={`${checks.filter((check) => check.state === "ok").length} / ${checks.length}`}
          hint={
            failing === 0 ? "aucun service en panne" : `${failing} en panne`
          }
        />
        <StatTile
          label="Version en ligne"
          value={
            server.version === "développement"
              ? "dév."
              : server.version.slice(0, 7)
          }
          hint={`démarrée ${formatRelative(server.startedAt)}`}
        />
        <StatTile
          label="Mémoire utilisée"
          value={formatShare(usedMemory, server.memory.total)}
          hint={`${formatBytes(usedMemory)} sur ${formatBytes(server.memory.total)} · site ${formatBytes(server.processMemory)}`}
        />
        <StatTile
          label="Disque utilisé"
          value={server.disk ? formatShare(usedDisk, server.disk.total) : "–"}
          hint={
            server.disk
              ? `${formatBytes(server.disk.free)} libres · charge ${server.load.map(formatDecimal).join(" · ")}`
              : undefined
          }
        />
      </StatGrid>

      <Panel title="Services">
        <ul className="grid gap-3 md:grid-cols-2">
          {checks.map((check) => (
            <li
              key={check.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{check.name}</p>
                <p className="text-sm break-words text-muted-foreground">
                  {check.detail}
                  {check.latencyMs != null
                    ? ` · ${formatNumber(check.latencyMs)} ms`
                    : ""}
                </p>
              </div>
              <StatusBadge state={check.state} />
            </li>
          ))}
        </ul>
      </Panel>

      <PanelGrid>
        <Panel title="Tâches planifiées">
          <ul className="grid gap-3">
            <li className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  Sauvegarde des données (chaque nuit)
                </p>
                <p className="text-sm text-muted-foreground">
                  {!backups.mounted
                    ? "Dossier des sauvegardes non monté ou illisible (normal en développement)"
                    : backups.latest
                      ? `${formatRelative(backups.latest.at)} · ${formatBytes(backups.latest.bytes)} · ${backups.count} fichiers gardés`
                      : "Aucune sauvegarde"}
                </p>
              </div>
              <StatusBadge
                state={
                  !backups.mounted
                    ? "off"
                    : ageState(
                        backups.latest?.at ?? null,
                        1.2,
                        server.checkedAt,
                      )
                }
              />
            </li>
            <li className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  Rétention des comptes inactifs (chaque nuit)
                </p>
                <p className="text-sm text-muted-foreground">
                  {retention
                    ? `${formatRelative(retention.at)} · ${formatNumber(Number(retention.details.warned ?? 0))} avertis, ${formatNumber(Number(retention.details.deleted ?? 0))} supprimés`
                    : "Jamais exécutée"}
                </p>
              </div>
              <StatusBadge
                state={
                  !retention
                    ? "warning"
                    : retention.ok
                      ? ageState(retention.at, 1.2, server.checkedAt)
                      : "error"
                }
              />
            </li>
            {data.cronJobs.map((job) => (
              <li
                key={job.name}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {job.name === "monthly-credit-grants"
                      ? "Remise mensuelle des crédits (chaque heure)"
                      : job.name === "daily-maintenance"
                        ? "Maintenance de la base (chaque nuit)"
                        : job.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {job.lastStart
                      ? `${formatRelative(job.lastStart)}${job.lastStatus === "failed" && job.lastMessage ? ` · ${job.lastMessage}` : ""}`
                      : "Pas encore exécutée"}
                  </p>
                </div>
                <StatusBadge
                  state={
                    !job.active
                      ? "off"
                      : job.lastStatus === "failed"
                        ? "error"
                        : job.lastStatus === "succeeded"
                          ? "ok"
                          : "warning"
                  }
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Activité">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                Opérations IA (24 h)
              </dt>
              <dd className="text-xl font-semibold tabular-nums">
                {formatNumber(data.aiLast24h)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Échecs IA (24 h)
              </dt>
              <dd className="text-xl font-semibold tabular-nums">
                {formatNumber(data.aiFailed24h)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Opérations en cours
              </dt>
              <dd className="text-xl font-semibold tabular-nums">
                {formatNumber(data.aiPending)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Dernier événement Stripe
              </dt>
              <dd className="text-xl font-semibold">
                {data.lastStripeEvent
                  ? formatRelative(data.lastStripeEvent)
                  : "aucun"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Base de données</dt>
              <dd className="font-semibold">
                {formatBytes(data.databaseBytes)} · PostgreSQL{" "}
                {data.postgresVersion.split(" ")[0]}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Dernière migration
              </dt>
              <dd className="font-semibold">{data.migration ?? "–"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Node.js</dt>
              <dd className="font-semibold">{server.node}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Vérifié le</dt>
              <dd className="font-semibold">
                {formatDateTime(server.checkedAt)}
              </dd>
            </div>
          </dl>
        </Panel>
      </PanelGrid>

      <Panel title="Tables" description="Lignes estimées et place occupée">
        {data.tables.length === 0 ? (
          <Empty>Aucune table.</Empty>
        ) : (
          <DataTable
            caption="Tables de la base"
            head={["Table", "Lignes", "Taille"]}
          >
            {data.tables.map((table) => (
              <tr key={table.name}>
                <td className="font-medium">{table.name}</td>
                <td className="tabular-nums">{formatNumber(table.rows)}</td>
                <td className="tabular-nums">{formatBytes(table.bytes)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
