import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { requireUser } from "@/features/auth/session";
import { CreditPackButtons } from "@/features/billing/presentation/offers";
import { getActivePlan } from "@/features/billing/subscription";
import type { CvSectionTitles } from "@/features/cv/content";
import {
  type Adaptation,
  AdaptTool,
} from "@/features/cv/presentation/adapt-tool";
import { CvNotFound } from "@/features/cv/presentation/cv-not-found";
import { CvTabs } from "@/features/cv/presentation/cv-tabs";
import { getOwnCv, listGenerations } from "@/features/cv/repository";
import type { CvContent } from "@/features/cv/schemas";
import { planEntitlements } from "@/features/plans/entitlements";
import { pickClientMessages } from "@/i18n/client-messages";
import { type AppLocale, routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvTools.adapt");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Adapter un CV à une offre d'emploi (US-27, docs/design/flows.md §4).
export default function AdaptPage({
  params,
}: PageProps<"/[locale]/cv/[id]/adapter">) {
  return (
    <div className="container-page py-6 md:py-10">
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <AdaptLoader params={params} />
      </Suspense>
    </div>
  );
}

/** Intitulés des rubriques dans chaque langue : le CV adapté peut changer de langue. */
async function allSectionTitles() {
  const entries = await Promise.all(
    routing.locales.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "cvSections" });
      const titles: CvSectionTitles = {
        summary: t("summary"),
        experiences: t("experiences"),
        skills: t("skills"),
        education: t("education"),
        languages: t("languages"),
      };
      return [locale, titles] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<AppLocale, CvSectionTitles>;
}

async function AdaptLoader({
  params,
}: Pick<PageProps<"/[locale]/cv/[id]/adapter">, "params">) {
  const { id } = await params;
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const cv = await getOwnCv(id);
  const t = await getTranslations();

  if (!cv) return <CvNotFound />;

  const [plan, generations, sectionTitles, messages] = await Promise.all([
    getActivePlan(),
    listGenerations(cv.id, "job_adaptation"),
    allSectionTitles(),
    pickClientMessages([
      "cvTools",
      "creditsDialog",
      "billing",
      "errors",
      "locales",
    ]),
  ]);
  const previous: Adaptation[] = generations.map((generation) => {
    const output = generation.output as {
      content: CvContent;
      missingKeywords: string[];
    };
    return {
      generationId: generation.id,
      language: generation.language,
      jobPosting: String(
        (generation.input as { jobPosting?: string }).jobPosting ?? "",
      ),
      content: output.content,
      missingKeywords: output.missingKeywords,
      createdAt: generation.created_at,
    };
  });

  return (
    <NextIntlClientProvider messages={messages}>
      <CvTabs cvId={cv.id} current="adapt" />
      <div className="grid gap-2">
        <h1 className="text-[1.75rem] leading-tight font-bold md:text-3xl">
          {t("cvTools.adapt.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("cvTools.adapt.intro", { title: cv.title })}
        </p>
        <div className="mt-6">
          <AdaptTool
            cvId={cv.id}
            cvLanguage={cv.language}
            canSaveAsNew={planEntitlements(plan).cvLimit === null}
            sectionTitles={sectionTitles}
            previous={previous}
            topUp={<CreditPackButtons returnTo={{ cvId: cv.id }} stacked />}
          />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
