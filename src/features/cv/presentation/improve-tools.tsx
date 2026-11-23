"use client";

import { HistoryIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { OPERATION_COSTS } from "@/features/plans/catalog";
import type { CvExperience } from "../schemas";
import { improveExperience, improveSummary } from "../tool-actions";
import { CreditsDialog } from "./credits-dialog";
import { useAiTool } from "./use-ai-tool";

// Améliorations sur place (US-25, US-26) : coût affiché sur le bouton, résultat proposé avant
// toute modification du CV.

function ToolButton({
  label,
  pending,
  disabled,
  onClick,
}: {
  label: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className="h-auto min-h-11 justify-self-start px-3 py-1.5 font-sans text-sm text-primary-strong"
    >
      {pending ? (
        <Loader2Icon aria-hidden="true" className="motion-safe:animate-spin" />
      ) : (
        <SparklesIcon aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}

function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="font-sans text-sm font-medium text-destructive">
      {message}
    </p>
  ) : null;
}

/** « Améliorer avec l'IA — 1 crédit » : avant / après, puis Remplacer ou Garder l'original. */
export function ImproveExperience({
  cvId,
  experience,
  disabled,
  onReplace,
  topUp,
}: {
  cvId: string;
  experience: CvExperience;
  disabled: boolean;
  onReplace: (proposal: CvExperience) => void;
  topUp?: ReactNode;
}) {
  const t = useTranslations("cvTools.experience");
  const tool = useAiTool(improveExperience);
  const [proposal, setProposal] = useState<CvExperience>();

  return (
    <div className="mt-1 grid gap-1">
      <ToolButton
        label={t("button", { cost: OPERATION_COSTS.improveExperience })}
        pending={tool.pending}
        disabled={disabled}
        onClick={() =>
          tool.run({ cvId, experienceId: experience.id }, (result) =>
            setProposal(result.proposal),
          )
        }
      />
      <ErrorText message={tool.error} />

      <AlertDialog
        open={Boolean(proposal)}
        onOpenChange={(open) => !open && setProposal(undefined)}
      >
        <AlertDialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              {t("title")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              [t("before"), experience.bullets],
              [t("after"), proposal?.bullets ?? []],
            ].map(([title, bullets]) => (
              <section
                key={title as string}
                className="rounded-lg border border-border p-4"
              >
                <h3 className="font-semibold">{title as string}</h3>
                <ul className="mt-2 list-disc ps-5">
                  {(bullets as string[]).map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("charged")}</p>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setProposal(undefined)}>
              {t("keep")}
            </Button>
            <Button
              onClick={() => {
                if (proposal) onReplace(proposal);
                setProposal(undefined);
              }}
            >
              {t("replace")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreditsDialog
        open={Boolean(tool.insufficient)}
        onOpenChange={(open) => !open && tool.closeInsufficient()}
        operation="improveExperience"
        details={tool.insufficient}
        topUp={topUp}
      />
    </div>
  );
}

/**
 * « Améliorer l'accroche — 1 crédit » : 3 ou 5 variantes selon la formule ; les propositions
 * précédentes restent consultables avec le CV (US-26 c.3).
 */
export function ImproveSummary({
  cvId,
  history,
  disabled,
  onChoose,
  topUp,
}: {
  cvId: string;
  /** Variantes déjà proposées, de la plus récente à la plus ancienne. */
  history: string[][];
  disabled: boolean;
  onChoose: (summary: string) => void;
  topUp?: ReactNode;
}) {
  const t = useTranslations("cvTools.summary");
  const tool = useAiTool(improveSummary);
  const [batches, setBatches] = useState(history);
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string>();
  const [latest, ...older] = batches;

  return (
    <div className="mt-1 grid gap-1">
      <div className="flex flex-wrap gap-1">
        <ToolButton
          label={t("button", { cost: OPERATION_COSTS.improveSummary })}
          pending={tool.pending}
          disabled={disabled}
          onClick={() =>
            tool.run({ cvId }, (result) => {
              setBatches([result.variants, ...batches]);
              setChoice(result.variants[0]);
              setOpen(true);
            })
          }
        />
        {batches.length > 0 ? (
          <Button
            variant="ghost"
            onClick={() => {
              setChoice(latest[0]);
              setOpen(true);
            }}
            className="h-auto min-h-11 px-3 py-1.5 font-sans text-sm"
          >
            <HistoryIcon aria-hidden="true" />
            {t("history", { count: batches.length })}
          </Button>
        ) : null}
      </div>
      <ErrorText message={tool.error} />

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              {t("title")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <fieldset className="grid gap-2">
            <legend className="sr-only">{t("title")}</legend>
            {[latest, ...older].filter(Boolean).flatMap((variants, batch) =>
              variants.map((variant, index) => (
                <label
                  key={`${batch}-${index}`}
                  className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 has-checked:border-primary has-checked:bg-surface"
                >
                  <input
                    type="radio"
                    name="accroche"
                    checked={choice === variant}
                    onChange={() => setChoice(variant)}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                  <span>
                    {batch > 0 && index === 0 ? (
                      <span className="mb-1 block text-sm font-medium text-muted-foreground">
                        {t("previous")}
                      </span>
                    ) : null}
                    {variant}
                  </span>
                </label>
              )),
            )}
          </fieldset>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={!choice}
              onClick={() => {
                if (choice) onChoose(choice);
                setOpen(false);
              }}
            >
              {t("choose")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreditsDialog
        open={Boolean(tool.insufficient)}
        onOpenChange={(value) => !value && tool.closeInsufficient()}
        operation="improveSummary"
        details={tool.insufficient}
        topUp={topUp}
      />
    </div>
  );
}
