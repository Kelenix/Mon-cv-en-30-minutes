import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { Appear } from "@/components/layout/appear";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/features/admin/access";
import { getUsers, USERS_PAGE_SIZE } from "@/features/admin/data";
import {
  formatDate,
  formatEuros,
  formatNumber,
  formatRelative,
} from "@/features/admin/format";
import { countryName, label } from "@/features/admin/labels";
import { DashboardSkeleton } from "@/features/admin/presentation/skeleton";
import {
  DataTable,
  Empty,
  PageHeader,
  Panel,
} from "@/features/admin/presentation/ui";

export const metadata: Metadata = { title: "Utilisateurs" };

const PLAN_FILTERS = [
  ["", "Toutes les formules"],
  ["none", "Sans abonnement"],
  ["essential", "Essential"],
  ["pro", "Pro"],
  ["premium", "Premium"],
] as const;

export default function UsersPage({
  searchParams,
}: PageProps<"/admin/utilisateurs">) {
  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Recherche par e-mail ou par nom ; fiche détaillée et actions sur chaque compte."
      />
      <Suspense fallback={<DashboardSkeleton tiles={0} />}>
        <Appear>
          <Users searchParams={searchParams} />
        </Appear>
      </Suspense>
    </>
  );
}

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

async function Users({
  searchParams,
}: {
  searchParams: PageProps<"/admin/utilisateurs">["searchParams"];
}) {
  await requireAdmin();
  const params = await searchParams;
  const search = text(params.q);
  const plan = PLAN_FILTERS.some(([value]) => value === text(params.formule))
    ? text(params.formule)
    : "";
  const page = Math.max(1, Math.floor(Number(text(params.page)) || 1));
  const { rows, total } = await getUsers({ search, plan, page });
  const pages = Math.max(1, Math.ceil(Number(total) / USERS_PAGE_SIZE));
  const pageLink = (target: number) =>
    `/admin/utilisateurs?${new URLSearchParams({ q: search, formule: plan, page: String(target) })}`;

  return (
    <div className="mt-6 grid gap-6">
      {params.supprime ? (
        <FormAlert tone="success" message="Compte supprimé." />
      ) : null}
      <form className="flex flex-wrap items-end gap-3" role="search">
        <label className="grid min-w-0 flex-1 basis-64 gap-2 text-sm font-medium">
          Rechercher
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="E-mail, prénom ou nom"
            className="h-11 rounded-lg border border-input bg-card px-3 text-base"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Formule
          <select
            name="formule"
            defaultValue={plan}
            className="h-11 rounded-lg border border-input bg-card px-3 text-base"
          >
            {PLAN_FILTERS.map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Filtrer</Button>
      </form>

      <Panel title={`${formatNumber(Number(total))} comptes`}>
        {rows.length === 0 ? (
          <Empty>Aucun compte ne correspond.</Empty>
        ) : (
          <DataTable
            caption="Comptes"
            head={[
              "Compte",
              "Formule",
              "Crédits",
              "CV",
              "Dépensé",
              "Pays",
              "Inscription",
              "Activité",
            ]}
          >
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link
                    href={`/admin/utilisateurs/${row.id}`}
                    className="font-medium text-primary-strong underline-offset-4 hover:underline"
                  >
                    {[row.first_name, row.last_name]
                      .filter(Boolean)
                      .join(" ") || "Sans nom"}
                  </Link>
                  <span className="block text-muted-foreground">
                    {row.email}
                  </span>
                  {row.banned ? (
                    <span className="mt-1 inline-block rounded-full bg-[#d03b3b]/10 px-2 text-xs font-medium text-[#a32626]">
                      Suspendu
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap">
                  {row.plan && row.subscription_status
                    ? `${label("plan", row.plan)} · ${label("status", row.subscription_status)}`
                    : "–"}
                </td>
                <td className="tabular-nums">{formatNumber(row.credits)}</td>
                <td className="tabular-nums">{formatNumber(row.cvs)}</td>
                <td className="whitespace-nowrap tabular-nums">
                  {formatEuros(Number(row.spent_cents))}
                </td>
                <td className="whitespace-nowrap">
                  {countryName(row.country)}
                </td>
                <td className="whitespace-nowrap">
                  {formatDate(row.created_at)}
                </td>
                <td className="whitespace-nowrap">
                  {formatRelative(row.last_seen_at)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {pages > 1 ? (
          <nav
            aria-label="Pages"
            className="mt-4 flex items-center justify-between gap-3 text-sm"
          >
            {page > 1 ? (
              <Link
                href={pageLink(page - 1)}
                className="font-medium text-primary-strong hover:underline"
              >
                ← Précédents
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              Page {page} sur {pages}
            </span>
            {page < pages ? (
              <Link
                href={pageLink(page + 1)}
                className="font-medium text-primary-strong hover:underline"
              >
                Suivants →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Panel>
    </div>
  );
}
