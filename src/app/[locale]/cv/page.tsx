import { FileTextIcon, PlusIcon } from "lucide-react";
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

// Mes CV : CV conservés par le compte (pagination et historique Pro : Inc-10).
export default async function CvListPage() {
  const t = await getTranslations("cvList");

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
            {t("title")}
          </h1>
          <Link href="/creer" className={buttonVariants()}>
            <PlusIcon aria-hidden="true" />
            {t("create")}
          </Link>
        </div>
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="mt-8 h-20 rounded-xl bg-surface motion-safe:animate-pulse"
            />
          }
        >
          <CvList />
        </Suspense>
      </div>
    </div>
  );
}

async function CvList() {
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const [cvs, t, format] = await Promise.all([
    listOwnCvs(),
    getTranslations("cvList"),
    getFormatter(),
  ]);

  if (cvs.length === 0) {
    return <p className="mt-8 text-lg text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="mt-8 grid gap-3">
      {cvs.map((cv) => (
        <li key={cv.id}>
          <Link
            href={{ pathname: "/cv/[id]", params: { id: cv.id } }}
            className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-accent"
          >
            <FileTextIcon
              aria-hidden="true"
              className="size-6 shrink-0 text-primary"
            />
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate font-semibold">{cv.title}</span>
              <span className="text-sm text-muted-foreground">
                {t("updated", {
                  date: format.dateTime(new Date(cv.updatedAt), {
                    dateStyle: "long",
                  }),
                })}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
