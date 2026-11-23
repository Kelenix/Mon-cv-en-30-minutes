import {
  ArrowRightIcon,
  FileTextIcon,
  LanguagesIcon,
  PlusIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  BRAND_POINTS,
  BrandAside,
  SPLIT_LAYOUT,
} from "@/components/layout/brand-aside";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/billing/subscription";
import { DeleteCvDialog } from "@/features/cv/presentation/delete-cv-dialog";
import { listOwnCvsPage } from "@/features/cv/repository";
import { planEntitlements } from "@/features/plans/entitlements";
import { pickClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvList");
  return { title: t("title"), robots: { index: false } };
}

/** CV affichés par page ; « Afficher plus » en ajoute autant (docs/design/flows.md §4). */
const PAGE_SIZE = 12;
const MAX_PAGES = 50;

// Mes CV (US-31) : historique sur toute la largeur, du plus récent au plus ancien, avec la règle
// de conservation de la formule ; ouverture et suppression de chaque CV.
export default async function CvListPage({
  searchParams,
}: PageProps<"/[locale]/cv">) {
  const t = await getTranslations("cvList");

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
          {t("title")}
        </h1>
        <Link href="/creer" className={buttonVariants({ size: "lg" })}>
          <PlusIcon aria-hidden="true" />
          {t("create")}
        </Link>
      </div>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="mt-8 h-24 rounded-2xl bg-surface motion-safe:animate-pulse"
          />
        }
      >
        <CvHistory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function pageNumber(value: string | string[] | undefined) {
  const page = Number.parseInt(String(value ?? "1"), 10);
  return Number.isNaN(page) ? 1 : Math.min(Math.max(page, 1), MAX_PAGES);
}

async function CvHistory({
  searchParams,
}: Pick<PageProps<"/[locale]/cv">, "searchParams">) {
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const page = pageNumber((await searchParams).page);
  const [{ cvs, total }, plan, t, tLocales, tHome, format, messages] =
    await Promise.all([
      listOwnCvsPage(PAGE_SIZE * page),
      getActivePlan(),
      getTranslations("cvList"),
      getTranslations("locales"),
      getTranslations("home"),
      getFormatter(),
      pickClientMessages(["cvList", "errors"]),
    ]);

  if (total === 0) {
    return (
      <div className={`${SPLIT_LAYOUT} mt-8`}>
        <div className="grid justify-items-start gap-4 lg:py-16">
          <h2 className="text-2xl font-bold">{t("emptyTitle")}</h2>
          <p className="text-lg text-muted-foreground">{t("empty")}</p>
          <Link href="/creer" className={buttonVariants({ size: "lg" })}>
            <PlusIcon aria-hidden="true" />
            {t("create")}
          </Link>
        </div>
        <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
      </div>
    );
  }

  const cvLimit = planEntitlements(plan).cvLimit;

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <ul className="grid gap-4">
            {cvs.map((cv) => (
              <li
                key={cv.id}
                className="relative flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-[background-color,box-shadow] has-[a:hover]:bg-accent has-[a:hover]:shadow-card-hover md:gap-6 md:p-6"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface md:size-14">
                  <FileTextIcon
                    aria-hidden="true"
                    className="size-6 text-primary md:size-7"
                  />
                </span>
                <span className="grid min-w-0 flex-1 gap-1">
                  {/* Lien étendu à toute la carte ; le bouton Supprimer reste au-dessus. */}
                  <Link
                    href={{ pathname: "/cv/[id]", params: { id: cv.id } }}
                    className="line-clamp-2 text-lg font-semibold wrap-anywhere outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50 md:text-xl"
                  >
                    {cv.title}
                  </Link>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span>
                      {t("updated", {
                        date: format.dateTime(new Date(cv.updatedAt), {
                          dateStyle: "long",
                        }),
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <LanguagesIcon aria-hidden="true" className="size-4" />
                      {tLocales(cv.language)}
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="hidden items-center gap-2 font-semibold text-primary-strong sm:inline-flex"
                >
                  {t("open")}
                  <ArrowRightIcon className="size-5" />
                </span>
                <div className="relative z-10">
                  <DeleteCvDialog
                    cvId={cv.id}
                    title={cv.title}
                    proUnlocked={cv.proUnlocked}
                  />
                </div>
              </li>
            ))}
          </ul>
          {cvs.length < total ? (
            <Link
              href={{ pathname: "/cv", query: { page: page + 1 } }}
              scroll={false}
              className={buttonVariants({
                variant: "outline",
                className: "justify-self-center",
              })}
            >
              {t("loadMore", { shown: cvs.length, total })}
            </Link>
          ) : null}
        </div>

        <aside
          aria-labelledby="historique"
          className="grid gap-4 rounded-2xl border border-border p-6 md:p-8 lg:sticky lg:top-24"
        >
          <h2 id="historique" className="text-xl font-semibold">
            {t("history.title")}
          </h2>
          <p className="text-3xl font-bold">
            {t("history.count", { count: total })}
          </p>
          <p>
            {cvLimit === null
              ? t("history.unlimited")
              : total > cvLimit
                ? t("history.kept")
                : t("history.limited", { limit: cvLimit })}
          </p>
          {cvLimit === null ? null : (
            <>
              <p className="text-muted-foreground">{t("history.upgrade")}</p>
              <Link
                href="/tarifs"
                className={buttonVariants({
                  variant: "outline",
                  className: "justify-self-start",
                })}
              >
                {t("history.seeOffers")}
              </Link>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            {t("history.contents")}
          </p>
        </aside>
      </div>
    </NextIntlClientProvider>
  );
}
