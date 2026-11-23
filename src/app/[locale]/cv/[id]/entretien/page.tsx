import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireUser } from "@/features/auth/session";
import { TopUpOptions } from "@/app/[locale]/_ui/top-up-options";
import { interviewOutputSchema } from "@/features/cv/generated";
import { CvNotFound } from "@/features/cv/presentation/cv-not-found";
import { ToolSkeleton } from "@/features/cv/presentation/tool-layout";
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
export default async function InterviewPage({
  params,
}: PageProps<"/[locale]/cv/[id]/entretien">) {
  const t = await getTranslations("cvTools.interview");
  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-3xl">
        {t("title")}
      </h1>
      <Suspense fallback={<ToolSkeleton />}>
        <Appear>
          <InterviewLoader params={params} />
        </Appear>
      </Suspense>
    </>
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

  if (!cv) return <CvNotFound heading="h2" />;

  const [generations, messages] = await Promise.all([
    listGenerations(cv.id, "interview"),
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
      <div className="mt-2 grid gap-2">
        <p className="text-lg text-muted-foreground">
          {t("intro", { title: cv.title })}
        </p>
        <div className="mt-6">
          <InterviewTool
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
