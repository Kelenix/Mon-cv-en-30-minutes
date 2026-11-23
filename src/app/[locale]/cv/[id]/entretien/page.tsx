import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { requireUser } from "@/features/auth/session";
import { CreditPackButtons } from "@/features/billing/presentation/offers";
import { interviewOutputSchema } from "@/features/cv/generated";
import { CvNotFound } from "@/features/cv/presentation/cv-not-found";
import { CvTabs } from "@/features/cv/presentation/cv-tabs";
import {
  type InterviewSession,
  InterviewTool,
} from "@/features/cv/presentation/interview-tool";
import { getOwnCv, listGenerations } from "@/features/cv/repository";
import { pickClientMessages } from "@/i18n/client-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvTools.interview");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Simulation d'entretien à partir du CV (US-30, docs/design/flows.md §4).
export default function InterviewPage({
  params,
}: PageProps<"/[locale]/cv/[id]/entretien">) {
  return (
    <div className="container-page py-6 md:py-10">
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <InterviewLoader params={params} />
      </Suspense>
    </div>
  );
}

async function InterviewLoader({
  params,
}: Pick<PageProps<"/[locale]/cv/[id]/entretien">, "params">) {
  const { id } = await params;
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const cv = await getOwnCv(id);
  const t = await getTranslations("cvTools.interview");

  if (!cv) return <CvNotFound />;

  const [generations, messages] = await Promise.all([
    listGenerations(cv.id, "interview"),
    pickClientMessages([
      "cvTools",
      "cvEditor",
      "creditsDialog",
      "billing",
      "errors",
      "locales",
    ]),
  ]);
  const previous: InterviewSession[] = generations.flatMap((generation) => {
    const output = interviewOutputSchema.safeParse(generation.output);
    if (!output.success) return [];
    const input = generation.input as { position?: string; answers?: string[] };
    return {
      generationId: generation.id,
      language: generation.language,
      position: input.position ?? "",
      questions: output.data.questions,
      answers: input.answers,
      feedback: output.data.feedback,
      createdAt: generation.created_at,
    };
  });

  return (
    <NextIntlClientProvider messages={messages}>
      <CvTabs cvId={cv.id} current="interview" />
      <div className="grid gap-2">
        <h1 className="text-[1.75rem] leading-tight font-bold md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("intro", { title: cv.title })}
        </p>
        <div className="mt-6">
          <InterviewTool
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
