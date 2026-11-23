"use client";

import { SparklesIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import { useHydrated } from "@/components/form/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPERATION_COSTS } from "@/features/plans/catalog";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  GENERATED_LIMITS,
  type LetterOutput,
  letterOutputSchema,
  type LinkedinOutput,
  linkedinOutputSchema,
  wordCount,
} from "../generated";
import {
  generateCoverLetter,
  generateLinkedin,
  updateGeneratedContent,
} from "../tool-actions";
import { CreditsDialog } from "./credits-dialog";
import { CopyButton, SaveIndicator, useAutosave } from "./editing";
import { ToolLayout } from "./tool-layout";
import { useAiTool } from "./use-ai-tool";

// Version LinkedIn et lettre de motivation (US-28, US-29) : générées à la demande, conservées
// avec le CV (H20), modifiables et copiables (H21).

export type Generated<Output> = {
  generationId: string;
  language: AppLocale;
  output: Output;
  createdAt?: string;
  /** Résumé de la demande dans l'historique (poste et entreprise d'une lettre). */
  label?: string;
};

/** Texte généré modifiable : compteur de caractères et bouton « Copier ». */
function CopyableField({
  label,
  copyLabel,
  value,
  max,
  rows,
  onChange,
  footer,
}: {
  label: string;
  copyLabel: string;
  value: string;
  max: number;
  rows: number;
  onChange: (value: string) => void;
  footer?: ReactNode;
}) {
  const t = useTranslations("cvTools.generated");
  const id = useId();
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id} className="text-base">
          {label}
        </Label>
        <CopyButton getText={() => value} label={copyLabel} />
      </div>
      <Textarea
        id={id}
        rows={rows}
        maxLength={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-compteur`}
        className="resize-y"
      />
      <p
        id={`${id}-compteur`}
        className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground tabular-nums"
      >
        <span>{footer}</span>
        <span>{t("counter", { count: value.length, max })}</span>
      </p>
    </div>
  );
}

export function LanguageSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AppLocale;
  onChange: (value: AppLocale) => void;
}) {
  const tLocales = useTranslations("locales");
  const id = useId();
  return (
    <div className="grid gap-2 sm:max-w-xs">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as AppLocale)}
        className="h-11 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {routing.locales.map((option) => (
          <option key={option} value={option}>
            {tLocales(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Bouton d'envoi et erreur d'un outil payant. */
export function GenerateControls({
  label,
  pending,
  error,
}: {
  label: string;
  pending: boolean;
  error?: string;
}) {
  const t = useTranslations("cvTools.generated");
  const hydrated = useHydrated();
  return (
    <>
      <Button
        type="submit"
        size="lg"
        disabled={!hydrated || pending}
        aria-busy={pending || undefined}
        className="justify-self-start"
      >
        <SparklesIcon aria-hidden="true" />
        {pending ? t("pending") : label}
      </Button>
      {error ? (
        <p role="alert" className="font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** Version listée dans l'historique : date et résumé de la demande. */
type HistoryItem = Pick<
  Generated<unknown>,
  "generationId" | "createdAt" | "label"
>;

/** Versions générées pour ce CV, de la plus récente à la plus ancienne (H20). */
export function History<Item extends HistoryItem>({
  items,
  current,
  onShow,
}: {
  items: Item[];
  current?: Item;
  onShow: (item: Item) => void;
}) {
  const t = useTranslations("cvTools.generated");
  const format = useFormatter();
  if (items.length < 2) return null;
  return (
    <section aria-labelledby="versions" className="grid gap-3">
      <h2 id="versions" className="text-xl font-semibold">
        {t("historyTitle")}
      </h2>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li
            key={item.generationId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <span className="line-clamp-2 min-w-0 flex-1 wrap-anywhere">
              {[
                item.createdAt
                  ? format.dateTime(new Date(item.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : t("justNow"),
                item.label,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <Button
              variant="ghost"
              onClick={() => onShow(item)}
              aria-current={
                item.generationId === current?.generationId || undefined
              }
            >
              {t("show")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Version affichée, historique et enregistrement automatique des modifications. */
function useGeneratedEditor<Output>(
  initial: Generated<Output>[],
  isValid: (output: Output) => boolean,
) {
  const [history, setHistory] = useState(initial);
  const [current, setCurrent] = useState(initial[0]);
  const autosave = useAutosave(
    (value: Generated<Output>) =>
      updateGeneratedContent({
        generationId: value.generationId,
        output: value.output,
      }),
    (value) => isValid(value.output),
  );

  function change(output: Output) {
    if (!current) return;
    const next = { ...current, output };
    setCurrent(next);
    setHistory(
      history.map((item) =>
        item.generationId === next.generationId ? next : item,
      ),
    );
    autosave.save(next);
  }

  /** Affiche une autre version ; la modification en attente part tout de suite. */
  function show(item: Generated<Output>) {
    if (current && !autosave.saved) autosave.save(current, 0);
    setCurrent(item);
  }

  function add(item: Generated<Output>) {
    show(item);
    setHistory([item, ...history]);
  }

  const saveIndicator = current ? (
    <SaveIndicator
      status={autosave.status}
      onRetry={() => autosave.save(current, 0)}
    />
  ) : null;

  return { history, current, change, show, add, saveIndicator };
}

/** Version LinkedIn (US-28) : titre, section Infos et une description par expérience. */
export function LinkedinTool({
  cvId,
  cvLanguage,
  previous,
  topUp,
}: {
  cvId: string;
  cvLanguage: AppLocale;
  previous: Generated<LinkedinOutput>[];
  topUp?: ReactNode;
}) {
  const t = useTranslations("cvTools.linkedin");
  const tool = useAiTool(generateLinkedin);
  const [language, setLanguage] = useState(cvLanguage);
  const editor = useGeneratedEditor(
    previous,
    (output) => linkedinOutputSchema.safeParse(output).success,
  );
  const current = editor.current;
  const cost = OPERATION_COSTS.linkedin;

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
                tool.run({ cvId, language }, (result) =>
                  editor.add({
                    generationId: result.generationId,
                    language,
                    output: result.output,
                  }),
                );
              }}
            >
              <LanguageSelect
                label={t("language")}
                value={language}
                onChange={setLanguage}
              />
              <GenerateControls
                label={
                  current ? t("regenerate", { cost }) : t("generate", { cost })
                }
                pending={tool.pending}
                error={tool.error}
              />
            </form>
            <History
              items={editor.history}
              current={current}
              onShow={editor.show}
            />
          </>
        }
        result={
          current ? (
            <section
              aria-labelledby="version-linkedin"
              lang={current.language}
              className="grid gap-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="version-linkedin" className="text-2xl font-bold">
                  {t("resultTitle")}
                </h2>
                {editor.saveIndicator}
              </div>
              <CopyableField
                label={t("headline")}
                copyLabel={t("copyHeadline")}
                value={current.output.headline}
                max={GENERATED_LIMITS.headline}
                rows={2}
                onChange={(headline) =>
                  editor.change({ ...current.output, headline })
                }
              />
              <CopyableField
                label={t("about")}
                copyLabel={t("copyAbout")}
                value={current.output.about}
                max={GENERATED_LIMITS.about}
                rows={10}
                onChange={(about) =>
                  editor.change({ ...current.output, about })
                }
              />
              {current.output.experiences.length > 0 ? (
                <div className="grid gap-6">
                  <h3 className="text-xl font-semibold">{t("experiences")}</h3>
                  {current.output.experiences.map((item, index) => {
                    const name =
                      [item.role, item.company].filter(Boolean).join(" — ") ||
                      t("untitled");
                    return (
                      <CopyableField
                        key={item.id}
                        label={name}
                        copyLabel={t("copyExperience", { name })}
                        value={item.description}
                        max={GENERATED_LIMITS.experience}
                        rows={6}
                        onChange={(description) =>
                          editor.change({
                            ...current.output,
                            experiences: current.output.experiences.map(
                              (entry, position) =>
                                position === index
                                  ? { ...entry, description }
                                  : entry,
                            ),
                          })
                        }
                      />
                    );
                  })}
                </div>
              ) : null}
            </section>
          ) : null
        }
      />
      <CreditsDialog
        open={Boolean(tool.insufficient)}
        onOpenChange={(open) => !open && tool.closeInsufficient()}
        operation="linkedin"
        details={tool.insufficient}
        topUp={topUp}
      />
    </>
  );
}

/** Lettre de motivation (US-29) : poste, entreprise et annonce, puis lettre modifiable. */
export function LetterTool({
  cvId,
  cvLanguage,
  previous,
  topUp,
}: {
  cvId: string;
  cvLanguage: AppLocale;
  previous: Generated<LetterOutput>[];
  topUp?: ReactNode;
}) {
  const t = useTranslations("cvTools.letter");
  const tool = useAiTool(generateCoverLetter);
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [language, setLanguage] = useState(cvLanguage);
  const editor = useGeneratedEditor(
    previous,
    (output) => letterOutputSchema.safeParse(output).success,
  );
  const current = editor.current;

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
                tool.run(
                  { cvId, position, company, jobPosting, language },
                  (result) =>
                    editor.add({
                      generationId: result.generationId,
                      language,
                      output: result.output,
                      label: [position.trim(), company.trim()]
                        .filter(Boolean)
                        .join(" — "),
                    }),
                );
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="lettre-poste" className="text-base">
                    {t("position")}
                  </Label>
                  <Input
                    id="lettre-poste"
                    required
                    autoComplete="off"
                    maxLength={GENERATED_LIMITS.position}
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lettre-entreprise" className="text-base">
                    {t("company")}
                  </Label>
                  <Input
                    id="lettre-entreprise"
                    autoComplete="off"
                    maxLength={GENERATED_LIMITS.company}
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lettre-annonce" className="text-base">
                  {t("posting")}
                </Label>
                <p
                  id="lettre-annonce-aide"
                  className="text-sm text-muted-foreground"
                >
                  {t("postingHint")}
                </p>
                <Textarea
                  id="lettre-annonce"
                  rows={6}
                  maxLength={GENERATED_LIMITS.jobPosting}
                  value={jobPosting}
                  onChange={(event) => setJobPosting(event.target.value)}
                  aria-describedby="lettre-annonce-aide"
                  className="resize-y"
                />
              </div>
              <LanguageSelect
                label={t("language")}
                value={language}
                onChange={setLanguage}
              />
              <GenerateControls
                label={t("generate", { cost: OPERATION_COSTS.coverLetter })}
                pending={tool.pending}
                error={tool.error}
              />
            </form>
            <History
              items={editor.history}
              current={current}
              onShow={editor.show}
            />
          </>
        }
        result={
          current ? (
            <section
              aria-labelledby="lettre-resultat"
              lang={current.language}
              className="grid gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="lettre-resultat" className="text-2xl font-bold">
                  {t("resultTitle")}
                </h2>
                {editor.saveIndicator}
              </div>
              <CopyableField
                label={t("letter")}
                copyLabel={t("copy")}
                value={current.output.letter}
                max={GENERATED_LIMITS.letter}
                rows={18}
                onChange={(letter) => editor.change({ letter })}
                footer={t("words", { count: wordCount(current.output.letter) })}
              />
            </section>
          ) : null
        }
      />
      <CreditsDialog
        open={Boolean(tool.insufficient)}
        onOpenChange={(open) => !open && tool.closeInsufficient()}
        operation="coverLetter"
        details={tool.insufficient}
        topUp={topUp}
      />
    </>
  );
}
