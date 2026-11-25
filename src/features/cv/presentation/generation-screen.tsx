"use client";

import { RotateCcwIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ErrorCode, FieldErrors } from "@/core/action-result";
import { Link, useRouter } from "@/i18n/navigation";
import { generateCv } from "../actions";
import { defaultCountry } from "../countries";
import { clearDraft, useDraft } from "../draft";
import type { CvSummary } from "../repository";
import { cvAnswersSchema } from "../schemas";
import { CreditsDialog } from "./credits-dialog";
import { GenerationSteps } from "./generation-steps";

type State =
  | { kind: "idle" }
  | { kind: "generating"; step: number }
  | { kind: "replace" }
  | { kind: "error"; code: ErrorCode; details?: FieldErrors };

/**
 * Génération du CV (US-11, docs/design/flows.md §3.5 à §3.9) : lancée dès l'arrivée sur la page
 * avec le brouillon du navigateur ; étapes annoncées ; en cas d'échec, les réponses restent et
 * les crédits sont rendus. Si la formule ne garde qu'un CV, l'utilisateur choisit d'abord celui
 * qui sera remplacé (H22).
 */
export function GenerationScreen({
  cvs,
  cvLimit,
  topUp,
}: {
  cvs: CvSummary[];
  cvLimit: number | null;
  /** Achat de crédits proposé dans la fenêtre « Solde insuffisant » (fourni par la page). */
  topUp?: ReactNode;
}) {
  const t = useTranslations("generation");
  const tErrors = useTranslations("errors");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const draft = useDraft();
  const started = useRef(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [replaceCvId, setReplaceCvId] = useState(cvs[0]?.id);
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(true);

  const ready = Boolean(
    draft && cvAnswersSchema.safeParse(draft.answers).success,
  );
  const limitReached = cvLimit !== null && cvs.length >= cvLimit;

  async function start(replaceId?: string) {
    if (!draft) return;
    setState({ kind: "generating", step: 0 });
    setCreditsDialogOpen(true);
    const result = await generateCv({
      requestId: crypto.randomUUID(),
      answers: draft.answers,
      language: draft.language ?? locale,
      country: draft.country ?? defaultCountry(locale, navigator.languages),
      template: draft.template,
      replaceCvId: replaceId,
    });
    if (result.ok) {
      setState({ kind: "generating", step: 2 });
      router.replace({
        pathname: "/cv/[id]",
        params: { id: result.data.cvId },
      });
      clearDraft();
    } else if (result.error.code === "CV_LIMIT_REACHED") {
      setState({ kind: "replace" });
    } else {
      setState({ kind: "error", ...result.error });
    }
  }

  // Lancement automatique, une seule fois, dès que le brouillon est lu.
  useEffect(() => {
    if (started.current || !ready || limitReached) return;
    started.current = true;
    void start();
  });

  // L'étape « Rédaction » suit « Analyse » ; « Mise en forme » arrive avec la réponse.
  const generatingStep = state.kind === "generating" ? state.step : null;
  useEffect(() => {
    if (generatingStep !== 0) return;
    const timer = setTimeout(
      () =>
        setState((current) =>
          current.kind === "generating" && current.step === 0
            ? { kind: "generating", step: 1 }
            : current,
        ),
      1_200,
    );
    return () => clearTimeout(timer);
  }, [generatingStep]);

  if (state.kind === "generating")
    return <GenerationSteps current={state.step} />;
  if (draft === null) return <GenerationSteps current={0} />;

  if (!ready) {
    return (
      <div className="grid gap-4">
        <p className="text-lg">{t("noDraft")}</p>
        <Link
          href="/creer"
          className={buttonVariants({ className: "justify-self-start" })}
        >
          {t("answerQuestions")}
        </Link>
      </div>
    );
  }

  const replaceOpen =
    state.kind === "replace" || (state.kind === "idle" && limitReached);
  if (replaceOpen) {
    return (
      <AlertDialog open onOpenChange={(open) => !open && router.push("/cv")}>
        <AlertDialogContent className="max-w-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              {t("replace.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground">
              {t("replace.description", { limit: cvLimit ?? 1 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <fieldset className="grid gap-2">
            <legend className="sr-only">{t("replace.legend")}</legend>
            {cvs.map((cv) => (
              <label
                key={cv.id}
                className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 has-checked:border-primary has-checked:bg-surface"
              >
                <input
                  type="radio"
                  name="cv-remplace"
                  value={cv.id}
                  checked={replaceCvId === cv.id}
                  onChange={() => setReplaceCvId(cv.id)}
                  className="mt-1 size-4 accent-primary"
                />
                <span className="grid gap-0.5">
                  <span className="font-medium">{cv.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("replace.updated", {
                      date: format.dateTime(new Date(cv.updatedAt), {
                        dateStyle: "short",
                      }),
                    })}
                  </span>
                  {cv.proUnlocked ? (
                    <span className="text-sm font-medium text-destructive">
                      {t("replace.proWarning")}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </fieldset>
          <AlertDialogFooter className="sm:flex-wrap">
            <Link href="/cv" className={buttonVariants({ variant: "ghost" })}>
              {t("cancel")}
            </Link>
            <Link
              href="/tarifs"
              className={buttonVariants({ variant: "outline" })}
            >
              {t("replace.upgrade")}
            </Link>
            <Button
              onClick={() => void start(replaceCvId)}
              disabled={!replaceCvId}
            >
              {t("replace.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (state.kind !== "error") return <GenerationSteps current={0} />;

  return (
    <div className="grid gap-6">
      <FormAlert message={tErrors(state.code)} />
      <div className="flex flex-wrap gap-3">
        {state.code === "FREE_LIMIT_REACHED" ? (
          <Link href="/tarifs" className={buttonVariants()}>
            {t("seeOffers")}
          </Link>
        ) : (
          <Button
            onClick={() =>
              void start(replaceCvId && limitReached ? replaceCvId : undefined)
            }
          >
            <RotateCcwIcon aria-hidden="true" />
            {t("retry")}
          </Button>
        )}
        <Link href="/creer" className={buttonVariants({ variant: "outline" })}>
          {t("editAnswers")}
        </Link>
      </div>

      <CreditsDialog
        open={state.code === "INSUFFICIENT_CREDITS" && creditsDialogOpen}
        onOpenChange={setCreditsDialogOpen}
        operation="generateCv"
        details={state.details}
        topUp={topUp}
      />
    </div>
  );
}
