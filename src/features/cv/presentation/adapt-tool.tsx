"use client";

import { LockIcon, SparklesIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { useHydrated } from "@/components/form/use-hydrated";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { OPERATION_COSTS } from "@/features/plans/catalog";
import { Link, useRouter } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import type { CvSectionTitles } from "../content";
import type { CvContent } from "../schemas";
import { adaptToJob, applyAdaptation } from "../tool-actions";
import { CreditsDialog } from "./credits-dialog";
import {
  EducationView,
  ExperiencesView,
  HeaderView,
  LanguagesView,
} from "./cv-views";
import { ToolLayout } from "./tool-layout";
import { useAiTool } from "./use-ai-tool";

const POSTING_MAX = 10_000;

export type Adaptation = {
  generationId: string;
  language: AppLocale;
  jobPosting: string;
  content: CvContent;
  missingKeywords: string[];
  createdAt?: string;
};

/**
 * Adapter le CV à une offre (US-27) : annonce collée, langue choisie (US-42 c.4), CV adapté et
 * mots-clés manquants ; application au CV courant ou, en Pro et Premium, nouveau CV.
 */
export function AdaptTool({
  cvId,
  cvLanguage,
  canSaveAsNew,
  sectionTitles,
  previous,
  topUp,
}: {
  cvId: string;
  cvLanguage: AppLocale;
  canSaveAsNew: boolean;
  sectionTitles: Record<AppLocale, CvSectionTitles>;
  previous: Adaptation[];
  topUp?: ReactNode;
}) {
  const t = useTranslations("cvTools.adapt");
  const tLocales = useTranslations("locales");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();
  const tool = useAiTool(adaptToJob);
  const [posting, setPosting] = useState("");
  const [language, setLanguage] = useState(cvLanguage);
  const [result, setResult] = useState<Adaptation | undefined>(previous[0]);
  const [history, setHistory] = useState(previous);
  const [applying, startApplying] = useTransition();
  const [applyError, setApplyError] = useState<string>();

  function adapt() {
    tool.run({ cvId, jobPosting: posting, language }, (adaptation) => {
      const next = { ...adaptation, language, jobPosting: posting };
      setResult(next);
      setHistory([next, ...history]);
    });
  }

  function apply(mode: "replace" | "new") {
    if (!result) return;
    setApplyError(undefined);
    startApplying(async () => {
      const outcome = await applyAdaptation({
        generationId: result.generationId,
        mode,
        locale,
      });
      if (outcome.ok) {
        router.push({
          pathname: "/cv/[id]",
          params: { id: outcome.data.cvId },
        });
        router.refresh();
      } else {
        setApplyError(tErrors(outcome.error.code));
      }
    });
  }

  const titles = result ? sectionTitles[result.language] : undefined;

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
                adapt();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="annonce" className="text-base">
                  {t("postingLabel")}
                </Label>
                <p id="annonce-aide" className="text-sm text-muted-foreground">
                  {t("postingHint")}
                </p>
                <Textarea
                  id="annonce"
                  rows={10}
                  maxLength={POSTING_MAX}
                  value={posting}
                  onChange={(event) => setPosting(event.target.value)}
                  aria-describedby="annonce-aide annonce-compteur"
                  className="min-h-48 resize-y"
                />
                <p
                  id="annonce-compteur"
                  className="justify-self-end text-sm text-muted-foreground tabular-nums"
                >
                  {t("counter", { count: posting.length, max: POSTING_MAX })}
                </p>
              </div>
              <div className="grid gap-2 sm:max-w-xs">
                <Label htmlFor="langue-adaptation" className="text-base">
                  {t("languageLabel")}
                </Label>
                <select
                  id="langue-adaptation"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as AppLocale)
                  }
                  className="h-11 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {routing.locales.map((option) => (
                    <option key={option} value={option}>
                      {tLocales(option)}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!hydrated || tool.pending}
                aria-busy={tool.pending || undefined}
                className="justify-self-start"
              >
                <SparklesIcon aria-hidden="true" />
                {tool.pending
                  ? t("pending")
                  : t("submit", { cost: OPERATION_COSTS.adaptToJob })}
              </Button>
              {tool.error ? (
                <p role="alert" className="font-medium text-destructive">
                  {tool.error}
                </p>
              ) : null}
            </form>
            {history.length > 1 || (history.length === 1 && !result) ? (
              <section aria-labelledby="adaptations" className="grid gap-3">
                <h2 id="adaptations" className="text-xl font-semibold">
                  {t("historyTitle")}
                </h2>
                <ul className="grid gap-2">
                  {history.map((item) => (
                    <li
                      key={item.generationId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                    >
                      <span className="line-clamp-2 min-w-0 flex-1 wrap-anywhere">
                        {item.createdAt
                          ? `${format.dateTime(new Date(item.createdAt), { dateStyle: "medium" })} · `
                          : ""}
                        {item.jobPosting.slice(0, 120)}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => setResult(item)}
                        aria-current={item === result || undefined}
                      >
                        {t("show")}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        }
        result={
          result && titles ? (
            <section aria-labelledby="cv-adapte" className="grid gap-6">
              <h2 id="cv-adapte" className="text-2xl font-bold">
                {t("resultTitle")}
              </h2>
              <div className="grid gap-3 rounded-xl bg-surface p-5">
                <h3 className="text-lg font-semibold">{t("missingTitle")}</h3>
                {result.missingKeywords.length > 0 ? (
                  <>
                    <p>{t("missingHint")}</p>
                    <ul className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((keyword) => (
                        <li
                          key={keyword}
                          className="rounded-full border border-primary/40 bg-background px-3 py-1 text-sm font-medium"
                        >
                          {keyword}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>{t("noMissing")}</p>
                )}
              </div>

              <div className="flex flex-wrap items-start gap-3">
                <Button onClick={() => apply("replace")} disabled={applying}>
                  {t("apply")}
                </Button>
                {canSaveAsNew ? (
                  <Button
                    variant="outline"
                    onClick={() => apply("new")}
                    disabled={applying}
                  >
                    {t("saveAsNew")}
                  </Button>
                ) : (
                  <Popover>
                    <PopoverTrigger
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <LockIcon aria-hidden="true" />
                      {t("saveAsNew")}
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-80 gap-3 p-4 text-base"
                    >
                      <PopoverDescription className="text-foreground">
                        {t("saveAsNewLocked")}
                      </PopoverDescription>
                      <Link href="/tarifs" className={buttonVariants()}>
                        {t("seeOffers")}
                      </Link>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {applyError ? (
                <p role="alert" className="font-medium text-destructive">
                  {applyError}
                </p>
              ) : null}

              <article
                lang={result.language}
                aria-label={t("previewLabel")}
                className="w-full rounded-sm bg-white px-5 py-6 font-cv leading-relaxed wrap-anywhere text-neutral-900 shadow-card ring-1 ring-border sm:px-10 sm:py-10"
              >
                <HeaderView header={result.content.header} />
                {[
                  [
                    titles.summary,
                    result.content.summary ? (
                      <p>{result.content.summary}</p>
                    ) : null,
                  ],
                  [
                    titles.experiences,
                    result.content.experiences.length ? (
                      <ExperiencesView items={result.content.experiences} />
                    ) : null,
                  ],
                  [
                    titles.skills,
                    result.content.skills.length ? (
                      <p>{result.content.skills.join(" · ")}</p>
                    ) : null,
                  ],
                  [
                    titles.education,
                    result.content.education.length ? (
                      <EducationView items={result.content.education} />
                    ) : null,
                  ],
                  [
                    titles.languages,
                    result.content.languages.length ? (
                      <LanguagesView items={result.content.languages} />
                    ) : null,
                  ],
                ].map(([title, body]) =>
                  body ? (
                    <section key={title as string} className="mt-6">
                      <h3 className="border-b-2 border-cv-accent pb-0.5 text-[1.05em] font-bold tracking-wide text-cv-accent uppercase">
                        {title}
                      </h3>
                      <div className="mt-2">{body}</div>
                    </section>
                  ) : null,
                )}
              </article>
            </section>
          ) : null
        }
      />
      <CreditsDialog
        open={Boolean(tool.insufficient)}
        onOpenChange={(open) => !open && tool.closeInsufficient()}
        operation="adaptToJob"
        details={tool.insufficient}
        topUp={topUp}
      />
    </>
  );
}
