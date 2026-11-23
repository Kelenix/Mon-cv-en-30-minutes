import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { requireUser } from "@/features/auth/session";
import { CreditPackButtons } from "@/features/billing/presentation/offers";
import type { LinkedinOutput } from "@/features/cv/generated";
import { CvNotFound } from "@/features/cv/presentation/cv-not-found";
import { CvTabs } from "@/features/cv/presentation/cv-tabs";
import {
  type Generated,
  LinkedinTool,
} from "@/features/cv/presentation/generated-tools";
import { getOwnCv, listGenerations } from "@/features/cv/repository";
import { pickClientMessages } from "@/i18n/client-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvTools.linkedin");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Version LinkedIn du CV (US-28, docs/design/flows.md §4).
export default function LinkedinPage({
  params,
}: PageProps<"/[locale]/cv/[id]/linkedin">) {
  return (
    <div className="container-page py-6 md:py-10">
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <LinkedinLoader params={params} />
      </Suspense>
    </div>
  );
}

async function LinkedinLoader({
  params,
}: Pick<PageProps<"/[locale]/cv/[id]/linkedin">, "params">) {
  const { id } = await params;
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const cv = await getOwnCv(id);
  const t = await getTranslations("cvTools.linkedin");

  if (!cv) return <CvNotFound />;

  const [generations, messages] = await Promise.all([
    listGenerations(cv.id, "linkedin"),
    pickClientMessages([
      "cvTools",
      "cvEditor",
      "creditsDialog",
      "billing",
      "errors",
      "locales",
    ]),
  ]);
  const previous: Generated<LinkedinOutput>[] = generations.map(
    (generation) => ({
      generationId: generation.id,
      language: generation.language,
      output: generation.output as LinkedinOutput,
      createdAt: generation.created_at,
    }),
  );

  return (
    <NextIntlClientProvider messages={messages}>
      <CvTabs cvId={cv.id} current="linkedin" />
      <div className="grid gap-2">
        <h1 className="text-[1.75rem] leading-tight font-bold md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("intro", { title: cv.title })}
        </p>
        <div className="mt-6">
          <LinkedinTool
            cvId={cv.id}
            cvLanguage={cv.language}
            previous={previous}
            topUp={<CreditPackButtons returnTo={{ cvId: cv.id }} stacked />}
          />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
