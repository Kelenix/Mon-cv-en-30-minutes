"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleIcon,
  SparklesIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { EMPTY_ANSWERS, saveDraft, useDraft } from "../draft";
import {
  ANSWER_KEYS,
  ANSWER_MAX,
  cvAnswersSchema,
  SHORT_ANSWERS_THRESHOLD,
} from "../schemas";

const LAST_STEP = ANSWER_KEYS.length - 1;

/**
 * Assistant des 5 questions (US-10, docs/design/flows.md §3.3) : une question par écran, exemple
 * dépliable (sur ordinateur : exemple visible et récapitulatif des réponses à droite), compteur,
 * brouillon gardé dans le navigateur ; langue du CV à la dernière question (US-42). Aucun appel
 * serveur, aucune publicité ni offre.
 */
export function CvWizard() {
  const t = useTranslations("wizard");
  const tLocales = useTranslations("locales");
  const locale = useLocale();
  const router = useRouter();
  const draft = useDraft();
  const field = useRef<HTMLTextAreaElement>(null);
  const shownStep = useRef<number | null>(null);

  const step = draft?.step ?? 0;
  // Focus sur la réponse à chaque changement de question (pas au premier affichage).
  useEffect(() => {
    if (draft === null) return;
    if (shownStep.current !== null && shownStep.current !== step) {
      field.current?.focus();
    }
    shownStep.current = step;
  }, [draft, step]);

  if (draft === null) return <FormSkeleton fields={1} />;

  const answers = draft?.answers ?? EMPTY_ANSWERS;
  const language = draft?.language ?? locale;
  const key = ANSWER_KEYS[step];
  const value = answers[key];
  const jobMissing = !cvAnswersSchema.shape.job.safeParse(answers.job).success;
  const otherAnswersLength = ANSWER_KEYS.slice(1).reduce(
    (total, answerKey) => total + answers[answerKey].trim().length,
    0,
  );
  const update = (changes: Partial<NonNullable<typeof draft>>) =>
    saveDraft({ answers, step, language, ...changes });

  function generate() {
    if (jobMissing) return update({ step: 0 });
    router.push("/creer/generation");
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <form
        className="grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (step === LAST_STEP) generate();
          else update({ step: step + 1 });
        }}
      >
        <div className="grid gap-2">
          <p
            id="progression"
            className="text-sm font-medium text-muted-foreground"
          >
            {t("progress", { current: step + 1, total: ANSWER_KEYS.length })}
          </p>
          <div
            role="progressbar"
            aria-labelledby="progression"
            aria-valuemin={1}
            aria-valuemax={ANSWER_KEYS.length}
            aria-valuenow={step + 1}
            className="flex gap-1.5"
          >
            {ANSWER_KEYS.map((answerKey, index) => (
              <span
                key={answerKey}
                className={
                  index <= step
                    ? "h-2 flex-1 rounded-full bg-primary"
                    : "h-2 flex-1 rounded-full bg-muted"
                }
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <Label
            htmlFor="reponse"
            className="text-xl leading-snug font-semibold md:text-2xl"
          >
            {t(`questions.${key}.title`)}
          </Label>
          <p id="reponse-aide" className="text-muted-foreground">
            {t(`questions.${key}.help`)}
          </p>
          <details className="rounded-lg bg-surface px-4 py-3 lg:hidden">
            <summary className="cursor-pointer font-medium">
              {t("example")}
            </summary>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">
              {t(`questions.${key}.example`)}
            </p>
          </details>
          <Textarea
            ref={field}
            id="reponse"
            rows={8}
            maxLength={ANSWER_MAX}
            value={value}
            onChange={(event) =>
              update({ answers: { ...answers, [key]: event.target.value } })
            }
            aria-describedby="reponse-aide reponse-compteur"
            className="min-h-48 resize-y"
          />
          <p
            id="reponse-compteur"
            className="justify-self-end text-sm text-muted-foreground tabular-nums"
          >
            {t("counter", { count: value.length, max: ANSWER_MAX })}
          </p>
          {step === 0 && jobMissing ? (
            <p className="text-sm font-medium text-muted-foreground">
              {t("jobRequired")}
            </p>
          ) : null}
        </div>

        {step === LAST_STEP ? (
          <div className="grid gap-4 rounded-xl border border-border p-4">
            <div className="grid gap-2">
              <Label htmlFor="langue-cv" className="text-base">
                {t("languageLabel")}
              </Label>
              <select
                id="langue-cv"
                value={language}
                onChange={(event) =>
                  update({ language: event.target.value as typeof language })
                }
                aria-describedby="langue-cv-aide"
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
              >
                {routing.locales.map((option) => (
                  <option key={option} value={option}>
                    {tLocales(option)}
                  </option>
                ))}
              </select>
              <p id="langue-cv-aide" className="text-sm text-muted-foreground">
                {t("languageHint")}
              </p>
            </div>
            {otherAnswersLength < SHORT_ANSWERS_THRESHOLD ? (
              <p role="status" className="rounded-lg bg-surface px-4 py-3">
                {t("shortAnswers")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => update({ step: step - 1 })}
            >
              <ArrowLeftIcon aria-hidden="true" />
              {t("previous")}
            </Button>
          ) : (
            <span />
          )}
          {step === LAST_STEP ? (
            <Button type="submit" size="lg" disabled={jobMissing}>
              <SparklesIcon aria-hidden="true" />
              {t("generate")}
            </Button>
          ) : (
            <Button type="submit" disabled={step === 0 && jobMissing}>
              {t("next")}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          )}
        </div>
        {step === LAST_STEP ? (
          <p className="text-center text-sm text-muted-foreground sm:text-end">
            {t("freeHint")}
          </p>
        ) : null}
      </form>

      <aside className="grid gap-6">
        <div className="hidden rounded-xl bg-surface p-5 lg:block">
          <h2 className="font-semibold">{t("exampleTitle")}</h2>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">
            {t(`questions.${key}.example`)}
          </p>
        </div>
        <section aria-labelledby="recapitulatif" className="grid gap-3">
          <h2 id="recapitulatif" className="text-lg font-semibold">
            {t("summaryTitle")}
          </h2>
          <ol className="grid gap-2">
            {ANSWER_KEYS.map((answerKey, index) => {
              const answer = answers[answerKey].trim();
              return (
                <li key={answerKey}>
                  <button
                    type="button"
                    onClick={() => update({ step: index })}
                    aria-current={index === step ? "step" : undefined}
                    className={cn(
                      "grid w-full gap-1 rounded-xl border p-4 text-start transition-colors outline-none hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
                      index === step
                        ? "border-primary bg-surface"
                        : "border-border",
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {answer ? (
                        <CheckCircle2Icon
                          aria-hidden="true"
                          className="size-5 shrink-0 text-primary"
                        />
                      ) : (
                        <CircleIcon
                          aria-hidden="true"
                          className="size-5 shrink-0 text-muted-foreground"
                        />
                      )}
                      {t(`questions.${answerKey}.title`)}
                    </span>
                    <span className="line-clamp-2 text-sm wrap-anywhere text-muted-foreground">
                      {answer || t("notAnswered")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </aside>
    </div>
  );
}
