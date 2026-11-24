import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { Appear } from "@/components/layout/appear";
import { requireAdmin } from "@/features/admin/access";
import { getUserDetail } from "@/features/admin/data";
import {
  formatDate,
  formatDateTime,
  formatDollars,
  formatEuros,
  formatNumber,
  formatRelative,
} from "@/features/admin/format";
import { countryName, label } from "@/features/admin/labels";
import { DashboardSkeleton } from "@/features/admin/presentation/skeleton";
import { DataTable, Empty, Panel } from "@/features/admin/presentation/ui";
import {
  BanForm,
  DeleteUserDialog,
  GrantCreditsForm,
} from "@/features/admin/presentation/user-actions";

export const metadata: Metadata = { title: "Fiche du compte" };

export default function UserPage({
  params,
}: PageProps<"/admin/utilisateurs/[id]">) {
  return (
    <>
      <Link
        href="/admin/utilisateurs"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Tous les comptes
      </Link>
      <Suspense fallback={<DashboardSkeleton tiles={4} />}>
        <Appear>
          <UserDetailContent params={params} />
        </Appear>
      </Suspense>
    </>
  );
}

function Field({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-sm text-muted-foreground">{name}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}

async function UserDetailContent({
  params,
}: {
  params: PageProps<"/admin/utilisateurs/[id]">["params"];
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await getUserDetail(id);
  if (!user) notFound();

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sans nom";
  const banned = Boolean(
    user.bannedUntil && new Date(user.bannedUntil) > new Date(),
  );
  const self = user.id === admin.id;
  const subscription = user.subscription;

  return (
    <div className="mt-2 grid gap-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{name}</h1>
        <p className="mt-1 break-all text-muted-foreground">
          {user.email}
          {banned ? (
            <span className="ml-3 rounded-full bg-[#d03b3b]/10 px-2.5 py-0.5 text-sm font-medium text-[#a32626]">
              Suspendu
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid min-w-0 content-start gap-6">
          <Panel title="Profil">
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field name="Inscription">{formatDateTime(user.createdAt)}</Field>
              <Field name="Dernière activité">
                {formatRelative(user.lastSeenAt)}
              </Field>
              <Field name="Dernière connexion">
                {formatDateTime(user.lastSignInAt)}
              </Field>
              <Field name="Connexion par">
                {user.providers
                  .map((provider) =>
                    provider === "email" ? "code e-mail" : provider,
                  )
                  .join(", ") || "–"}
              </Field>
              <Field name="Langue">{label("locale", user.locale)}</Field>
              <Field name="Pays">{countryName(user.country)}</Field>
              <Field name="Téléphone">{user.phone ?? "–"}</Field>
              <Field name="Ville">{user.city ?? "–"}</Field>
              <Field name="CV gratuit utilisé">
                {formatDate(user.freeGenerationUsedAt)}
              </Field>
              <Field name="Essai utilisé">{formatDate(user.trialUsedAt)}</Field>
              <Field name="Publicités retirées">
                {formatDate(user.adsRemovedAt)}
              </Field>
              <Field name="Avertissement d'inactivité">
                {formatDate(user.retentionWarningSentAt)}
              </Field>
            </dl>
          </Panel>

          <Panel title="Paiements">
            {user.payments.length === 0 ? (
              <Empty>Aucun paiement.</Empty>
            ) : (
              <DataTable
                caption="Paiements du compte"
                head={["Date", "Produit", "Moyen", "Montant"]}
              >
                {user.payments.map((payment) => (
                  <tr key={`${payment.at}-${payment.item}`}>
                    <td className="whitespace-nowrap">
                      {formatDateTime(payment.at)}
                    </td>
                    <td>{label("item", payment.item)}</td>
                    <td>{label("method", payment.method ?? "inconnu")}</td>
                    <td className="tabular-nums">
                      {formatEuros(payment.amount)}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>

          <Panel title="Mouvements de crédits" description="30 derniers">
            {user.ledger.length === 0 ? (
              <Empty>Aucun mouvement.</Empty>
            ) : (
              <DataTable
                caption="Mouvements de crédits"
                head={["Date", "Motif", "Solde", "Crédits"]}
              >
                {user.ledger.map((entry, index) => (
                  <tr key={`${entry.at}-${index}`}>
                    <td className="whitespace-nowrap">
                      {formatDateTime(entry.at)}
                    </td>
                    <td>{label("reason", entry.reason)}</td>
                    <td>
                      {entry.bucket === "included" ? "inclus" : "achetés"}
                    </td>
                    <td className="tabular-nums">
                      {entry.delta > 0 ? "+" : ""}
                      {formatNumber(entry.delta)}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>

          <Panel title="Opérations IA" description="30 dernières">
            {user.aiOperations.length === 0 ? (
              <Empty>Aucune opération.</Empty>
            ) : (
              <DataTable
                caption="Opérations IA du compte"
                head={["Date", "Opération", "État", "Crédits", "Coût"]}
              >
                {user.aiOperations.map((operation, index) => (
                  <tr key={`${operation.at}-${index}`}>
                    <td className="whitespace-nowrap">
                      {formatDateTime(operation.at)}
                    </td>
                    <td>{label("aiKind", operation.kind)}</td>
                    <td>
                      {operation.status === "succeeded"
                        ? "Réussie"
                        : operation.status === "failed"
                          ? `Échec${operation.error ? ` (${operation.error})` : ""}`
                          : "En cours"}
                    </td>
                    <td className="tabular-nums">
                      {operation.free
                        ? "gratuit"
                        : formatNumber(operation.credits)}
                    </td>
                    <td className="tabular-nums">
                      {operation.costMicros == null
                        ? "–"
                        : formatDollars(operation.costMicros)}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Panel title="Formule et crédits">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field name="Formule">
                {subscription
                  ? `${label("plan", subscription.plan)} ${label("interval", subscription.interval)}`
                  : "Aucun abonnement"}
              </Field>
              <Field name="État">
                {subscription ? label("status", subscription.status) : "–"}
              </Field>
              {subscription ? (
                <>
                  <Field
                    name={
                      subscription.cancelAtPeriodEnd ? "Fin le" : "Échéance"
                    }
                  >
                    {formatDate(subscription.currentPeriodEnd)}
                  </Field>
                  <Field name="Moyen de paiement">
                    {label("method", subscription.paymentMethod ?? "inconnu")}
                  </Field>
                </>
              ) : null}
              <Field name="Crédits inclus">
                {formatNumber(user.wallet?.included ?? 0)}
              </Field>
              <Field name="Crédits achetés">
                {formatNumber(user.wallet?.purchased ?? 0)}
              </Field>
            </dl>
          </Panel>

          <Panel
            title="Offrir des crédits"
            description="Ajoutés aux crédits achetés : ils n'expirent pas"
          >
            <GrantCreditsForm userId={user.id} />
          </Panel>

          <Panel
            title={`CV (${user.cvs.length})`}
            description="Titres seulement : le contenu reste privé"
          >
            {user.cvs.length === 0 ? (
              <Empty>Aucun CV.</Empty>
            ) : (
              <ul className="grid gap-2">
                {user.cvs.map((cv, index) => (
                  <li
                    key={`${cv.createdAt}-${index}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {cv.title}
                      {cv.pro ? " · CV Pro" : ""}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {label("locale", cv.language)} ·{" "}
                      {formatDate(cv.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {self ? (
            <Panel title="Accès">
              <p className="text-muted-foreground">
                C&apos;est votre compte : il ne peut être ni suspendu ni
                supprimé d&apos;ici.
              </p>
            </Panel>
          ) : (
            <Panel title="Accès au compte">
              <div className="grid gap-6">
                <BanForm userId={user.id} banned={banned} />
                <div className="grid gap-3 border-t border-border pt-6">
                  <p className="text-sm text-muted-foreground">
                    Suppression définitive, comme si l&apos;utilisateur la
                    demandait lui-même.
                  </p>
                  <DeleteUserDialog userId={user.id} email={user.email} />
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
