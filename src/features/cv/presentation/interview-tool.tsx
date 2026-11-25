"use client";

import { MessageSquareTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { useHydrated } from "@/components/form/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPERATION_COSTS } from "@/features/plans/catalog";
import type { AppLocale } from "@/i18n/routing";
import {
  GENERATED_LIMITS,
  INTERVIEW_LIMITS,
  type InterviewFeedback,
} from "../generated";
import { startInterview, submitInterviewAnswers } from "../tool-actions";
import { CreditsDialog } from "./credits-dialog";
import { GenerateControls, History, LanguageSelect } from "./generated-tools";
import { ToolLayout } from "./tool-layout";
import { useAiTool } from "./use-ai-tool";
import { cn } from "@/lib/utils";

// Simulation d'entretien (US-30) : 8 questions adaptées au CV et au poste, réponses écrites,
// puis un retour gratuit par question répondue ; chaque simulation est conservée avec le CV.

export type InterviewSession = {
  generationId: string;
  language: AppLocale;
  position: string;
  questions: string[];
  /** Réponses envoyées, présentes avec le retour. */
  answers?: string[];
  feedback?: InterviewFeedback[];
  createdAt?: string;
};

const NO_ANSWERS: string[] = Array(INTERVIEW_LIMITS.questions).fill("");

export function InterviewTool({
  cvId,
  cvLanguage,
  previous,
  topUp,
}: {
  cvId: string;
  cvLanguage: AppLocale;
  previous: InterviewSession[];
  topUp?: ReactNode;
}) {
  const t = useTranslations("cvTools.interview");
  const hydrated = useHydrated();
  const start = useAiTool(startInterview);
  const review = useAiTool(submitInterviewAnswers, {
    AI_UNAVAILABLE: t("reviewFailed"),
    AI_INVALID_OUTPUT: t("reviewFailed"),
  });
  const [position, setPosition] = useState("");
  const [language, setLanguage] = useState(cvLanguage);
  const [sessions, setSessions] = useState(previous);
  const [currentId, setCurrentId] = useState(previous[0]?.generationId);
  // Réponses en cours de rédaction, par simulation (gardées en changeant de simulation).
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});

  const current = sessions.find((item) => item.generationId === currentId);
  const answers = current
    ? (current.answers ?? drafts[current.generationId] ?? NO_ANSWERS)
    : NO_ANSWERS;

  // Réponses écrites et pas encore évaluées : le navigateur prévient avant de quitter la page.
  const unsent = sessions.some(
    (item) =>
      !item.feedback &&
      drafts[item.generationId]?.some((value) => value.trim()),
  );
  useEffect(() => {
    if (!unsent) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsent]);

  function answer(index: number, value: string) {
    if (!current) return;
    setDrafts({
      ...drafts,
      [current.generationId]: answers.map((item, position) =>
        position === index ? value : item,
      ),
    });
  }

  function submit() {
    if (!current) return;
    const sent = answers;
    review.run(
      { generationId: current.generationId, answers: sent },
      (result) => {
        setSessions((list) =>
          list.map((item) =>
            item.generationId === current.generationId
              ? {
                  ...item,
                  answers: sent.map((value) => value.trim()),
                  feedback: result.feedback,
                }
              : item,
          ),
        );
      },
    );
  }

  const cost = OPERATION_COSTS.interview;

  return (
    <>
      <ToolLayout
        empty={t("empty")}
        controls={
          <>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                start.run({ cvId, position, language }, (result) => {
                  const session: InterviewSession = {
                    generationId: result.generationId,
                    language,
                    position: position.trim(),
                    questions: result.questions,
                  };
                  setSessions((list) => [session, ...list]);
                  setCurrentId(session.generationId);
                });
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="entretien-poste" className="text-base">
                  {t("position")}
                </Label>
                <Input
                  id="entretien-poste"
                  required
                  autoComplete="off"
                  maxLength={GENERATED_LIMITS.position}
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                />
              </div>
              <LanguageSelect
                label={t("language")}
                value={language}
                onChange={setLanguage}
              />
              <GenerateControls
                label={
                  sessions.length > 0
                    ? t("restart", { cost })
                    : t("start", { cost })
                }
                pending={start.pending}
                error={start.error}
              />
            </form>
            <History
              items={sessions.map((item) => ({
                ...item,
                label: item.feedback
                  ? `${item.position} · ${t("reviewed")}`
                  : item.position,
              }))}
              current={current}
              onShow={(item) => setCurrentId(item.generationId)}
            />
          </>
        }
        result={
          current ? (
            <section aria-labelledby="simulation" className="grid gap-6">
              <div className="grid gap-1">
                <h2 id="simulation" className="text-2xl font-bold">
                  {t("resultTitle", { position: current.position })}
                </h2>
                <p className="text-muted-foreground">
                  {current.feedback ? t("reviewedHint") : t("answerHint")}
                </p>
              </div>
              <ol className="grid gap-4">
                {current.questions.map((question, index) => (
                  <li
                    key={question}
                    className="grid gap-3 rounded-xl border border-border p-4 sm:p-5"
                  >
                    <p className="text-sm font-semibold text-primary-strong">
                      {t("questionNumber", { number: index + 1 })}
                    </p>
                    {current.feedback ? (
                      <Reviewed
                        question={question}
                        language={current.language}
                        answer={answers[index]}
                        feedback={current.feedback.find(
                          (item) => item.index === index,
                        )}
                      />
                    ) : (
                      <AnswerField
                        id={`reponse-${index + 1}`}
                        question={question}
                        language={current.language}
                        value={answers[index]}
                        onChange={(value) => answer(index, value)}
                      />
                    )}
                  </li>
                ))}
              </ol>
              {current.feedback ? null : (
                <div className="grid gap-2">
                  <Button
                    size="lg"
                    onClick={submit}
                    disabled={
                      !hydrated ||
                      review.pending ||
                      !answers.some((value) => value.trim())
                    }
                    aria-busy={review.pending || undefined}
                    className="h-auto min-h-13 max-w-full justify-self-start py-3 text-center whitespace-normal"
                  >
                    <MessageSquareTextIcon aria-hidden="true" />
                    {review.pending ? t("reviewPending") : t("review")}
                  </Button>
                  {review.error ? (
                    <p role="alert" className="font-medium text-destructive">
                      {review.error}
                    </p>
                  ) : null}
                </div>
              )}
            </section>
          ) : null
        }
      />
      <CreditsDialog
        open={Boolean(start.insufficient)}
        onOpenChange={(open) => !open && start.closeInsufficient()}
        operation="interview"
        details={start.insufficient}
        topUp={topUp}
      />
    </>
  );
}

function AnswerField({
  id,
  question,
  language,
  value,
  onChange,
}: {
  id: string;
  question: string;
  language: AppLocale;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("cvTools.generated");
  return (
    <>
      <Label htmlFor={id} lang={language} className="text-base leading-snug">
        {question}
      </Label>
      <Textarea
        id={id}
        rows={4}
        maxLength={INTERVIEW_LIMITS.answer}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-compteur`}
        className="resize-y"
      />
      <p
        id={`${id}-compteur`}
        className="justify-self-end text-sm text-muted-foreground tabular-nums"
      >
        {t("counter", { count: value.length, max: INTERVIEW_LIMITS.answer })}
      </p>
    </>
  );
}

/** Question évaluée : réponse, points forts, points à améliorer, exemple (US-30 c.3). */
function Reviewed({
  question,
  language,
  answer,
  feedback,
}: {
  question: string;
  language: AppLocale;
  answer: string;
  feedback?: InterviewFeedback;
}) {
  const t = useTranslations("cvTools.interview");
  const blocks = feedback
    ? [
        [t("yourAnswer"), answer, "bg-surface"],
        [
          t("strengths"),
          feedback.strengths,
          "border-l-4 border-success bg-surface",
        ],
        [
          t("improvements"),
          feedback.improvements,
          "border-l-4 border-premium bg-surface",
        ],
        [
          t("example"),
          feedback.example,
          "border-l-4 border-primary bg-surface",
        ],
      ]
    : [];
  return (
    <>
      <h3 lang={language} className="text-lg leading-snug font-semibold">
        {question}
      </h3>
      {feedback ? (
        <dl className="grid gap-3">
          {blocks.map(([title, text, style]) => (
            <div key={title} className={cn("grid gap-1 rounded-lg p-3", style)}>
              <dt className="font-semibold">{title}</dt>
              <dd lang={language} className="whitespace-pre-line">
                {text}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-muted-foreground">{t("unanswered")}</p>
      )}
    </>
  );
}
