import {
  ArrowRightIcon,
  FileTextIcon,
  LanguagesIcon,
  PlusIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { listOwnCvs } from "@/features/cv/repository";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvList");
  return { title: t("title"), robots: { index: false } };
}

// Mes CV : CV conservés par le compte, sur toute la largeur du site (pagination et historique
// Pro : Inc-10).
export default async function CvListPage() {
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
        <CvList />
      </Suspense>
    </div>
  );
}

async function CvList() {
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const [cvs, t, tLocales, format] = await Promise.all([
    listOwnCvs(),
    getTranslations("cvList"),
    getTranslations("locales"),
    getFormatter(),
  ]);

  if (cvs.length === 0) {
    return <p className="mt-8 text-lg text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="mt-8 grid gap-4">
      {cvs.map((cv) => (
        <li key={cv.id}>
          <Link
            href={{ pathname: "/cv/[id]", params: { id: cv.id } }}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-[background-color,box-shadow] hover:bg-accent hover:shadow-card-hover md:gap-6 md:p-6"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface md:size-14">
              <FileTextIcon
                aria-hidden="true"
                className="size-6 text-primary md:size-7"
              />
            </span>
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="truncate text-lg font-semibold md:text-xl">
                {cv.title}
              </span>
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
            <span className="hidden items-center gap-2 font-semibold text-primary-strong sm:inline-flex">
              {t("open")}
              <ArrowRightIcon
                aria-hidden="true"
                className="size-5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
