import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { requireUser } from "@/features/auth/session";
import { CreditPackButtons } from "@/features/billing/presentation/offers";
import type { LetterOutput } from "@/features/cv/generated";
import { CvNotFound } from "@/features/cv/presentation/cv-not-found";
import { CvTabs } from "@/features/cv/presentation/cv-tabs";
import {
  type Generated,
  LetterTool,
} from "@/features/cv/presentation/generated-tools";
import { getOwnCv, listGenerations } from "@/features/cv/repository";
import { pickClientMessages } from "@/i18n/client-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvTools.letter");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Lettre de motivation à partir du CV (US-29, docs/design/flows.md §4).
export default function LetterPage({
  params,
}: PageProps<"/[locale]/cv/[id]/lettre">) {
  return (
    <div className="container-page py-6 md:py-10">
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <LetterLoader params={params} />
      </Suspense>
    </div>
  );
}

async function LetterLoader({
  params,
}: Pick<PageProps<"/[locale]/cv/[id]/lettre">, "params">) {
  const { id } = await params;
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const cv = await getOwnCv(id);
  const t = await getTranslations("cvTools.letter");

  if (!cv) return <CvNotFound />;

  const [generations, messages] = await Promise.all([
    listGenerations(cv.id, "cover_letter"),
    pickClientMessages([
      "cvTools",
      "cvEditor",
      "creditsDialog",
      "billing",
      "errors",
      "locales",
    ]),
  ]);
  const previous: Generated<LetterOutput>[] = generations.map((generation) => {
    const input = generation.input as { position?: string; company?: string };
    return {
      generationId: generation.id,
      language: generation.language,
      output: generation.output as LetterOutput,
      createdAt: generation.created_at,
      label: [input.position, input.company].filter(Boolean).join(" — "),
    };
  });

  return (
    <NextIntlClientProvider messages={messages}>
      <CvTabs cvId={cv.id} current="letter" />
      <div className="grid gap-2">
        <h1 className="text-[1.75rem] leading-tight font-bold md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("intro", { title: cv.title })}
        </p>
        <div className="mt-6">
          <LetterTool
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
