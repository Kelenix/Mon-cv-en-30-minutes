import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireUser } from "@/features/auth/session";
import { TopUpOptions } from "@/app/[locale]/_ui/top-up-options";
import { titleLine } from "@/features/cv/content";
import type { LetterOutput } from "@/features/cv/generated";
import { CvNotFound } from "@/features/cv/presentation/cv-not-found";
import { ToolSkeleton } from "@/features/cv/presentation/tool-layout";
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
export default async function LetterPage({
  params,
}: PageProps<"/[locale]/cv/[id]/lettre">) {
  const t = await getTranslations("cvTools.letter");
  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-3xl">
        {t("title")}
      </h1>
      <Suspense fallback={<ToolSkeleton />}>
        <Appear>
          <LetterLoader params={params} />
        </Appear>
      </Suspense>
    </>
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

  if (!cv) return <CvNotFound heading="h2" />;

  const [generations, messages] = await Promise.all([
    listGenerations(cv.id, "cover_letter"),
    pickClientMessages([
      "ads",
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
      label: titleLine(input.position, input.company),
    };
  });

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="mt-2 grid gap-2">
        <p className="text-lg text-muted-foreground">
          {t("intro", { title: cv.title })}
        </p>
        <div className="mt-6">
          <LetterTool
            cvId={cv.id}
            cvLanguage={cv.language}
            previous={previous}
            topUp={<TopUpOptions returnTo={{ cvId: cv.id }} stacked />}
          />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
