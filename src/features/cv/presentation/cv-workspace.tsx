"use client";

import { CheckIcon, PencilIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import { updateCv } from "../actions";
import { type CvSectionTitles, cvToPlainText } from "../content";
import { type CvContent, cvContentSchema } from "../schemas";
import {
  EducationEditor,
  ExperiencesEditor,
  HeaderEditor,
  LanguagesEditor,
  SkillsEditor,
  SummaryEditor,
} from "./cv-editors";
import {
  EducationView,
  ExperiencesView,
  HeaderView,
  LanguagesView,
} from "./cv-views";
import { CopyButton, SaveIndicator, useAutosave } from "./editing";
import { ExportButtons } from "./export-buttons";
import { ImproveExperience, ImproveSummary } from "./improve-tools";

type SectionKey = "header" | keyof CvSectionTitles;

/** Rubrique de la feuille : intitulé, bouton de modification, puis lecture ou saisie. */
function Section({
  title,
  editLabel,
  editing,
  onToggle,
  view,
  editor,
}: {
  title?: string;
  editLabel: string;
  editing: boolean;
  onToggle: () => void;
  view: ReactNode;
  editor: ReactNode;
}) {
  const t = useTranslations("cvEditor");
  // Commandes et champs dans la langue de l'interface, la feuille dans celle du CV.
  const uiLocale = useLocale();
  const headingId = useId();
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className="mt-6 first:mt-0"
    >
      <div
        className={
          title
            ? "flex items-center justify-between gap-2 border-b-2 border-cv-accent pb-0.5"
            : "flex items-start justify-between gap-2"
        }
      >
        {title ? (
          <h2
            id={headingId}
            className="text-[1.05em] font-bold tracking-wide text-cv-accent uppercase"
          >
            {title}
          </h2>
        ) : (
          <div className="min-w-0">{editing ? null : view}</div>
        )}
        <Button
          variant={editing ? "default" : "ghost"}
          size="icon"
          aria-label={
            editing
              ? t("done", { section: editLabel })
              : t("edit", { section: editLabel })
          }
          aria-expanded={editing}
          onClick={onToggle}
          lang={uiLocale}
          className="font-sans"
        >
          {editing ? (
            <CheckIcon aria-hidden="true" />
          ) : (
            <PencilIcon aria-hidden="true" />
          )}
        </Button>
      </div>
      {editing ? (
        <div lang={uiLocale} className="mt-3">
          {editor}
        </div>
      ) : title ? (
        <div className="mt-2">{view}</div>
      ) : null}
    </section>
  );
}

/**
 * Aperçu et éditeur du CV (US-12 à US-14, US-16, US-17) : feuille sur une colonne dans la langue
 * du CV, chaque rubrique modifiable sur place, enregistrement automatique gratuit, copie du
 * texte, exports PDF et DOCX.
 */
export function CvWorkspace({
  cvId,
  title,
  language,
  initialContent,
  sectionTitles,
  exportUnlocked,
  summaryHistory,
  topUp,
}: {
  cvId: string;
  title: string;
  language: AppLocale;
  initialContent: CvContent;
  sectionTitles: CvSectionTitles;
  /** PDF sans filigrane et DOCX autorisés (abonnement ou CV Pro). */
  exportUnlocked: boolean;
  /** Variantes d'accroche déjà proposées (US-26 c.3). */
  summaryHistory: string[][];
  /** Recharge proposée quand le solde ne suffit pas (fournie par la page). */
  topUp?: ReactNode;
}) {
  const t = useTranslations("cvEditor");
  const uiLocale = useLocale();
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState<SectionKey | null>(null);
  // Exports et outils IA lisent le CV enregistré : inactifs tant qu'une modification attend.
  const { status, save, saved } = useAutosave(
    (value: CvContent) => updateCv({ cvId, content: value }),
    (value) => cvContentSchema.safeParse(value).success,
  );

  function change(next: CvContent) {
    setContent(next);
    save(next);
  }
  const section = (key: SectionKey) => ({
    editing: editing === key,
    onToggle: () => setEditing(editing === key ? null : key),
  });
  const empty = (text: string) => (
    <p lang={uiLocale} className="text-cv-muted italic">
      {text}
    </p>
  );

  return (
    <div className="grid w-full min-w-0 gap-4">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <h1 className="w-full min-w-0 truncate text-lg font-bold sm:me-auto sm:w-auto md:text-xl">
          {title}
        </h1>
        <ExportButtons cvId={cvId} unlocked={exportUnlocked} ready={saved} />
        <CopyButton getText={() => cvToPlainText(content, sectionTitles)} />
        <SaveIndicator status={status} onRetry={() => save(content, 0)} />
      </div>

      <article
        lang={language}
        aria-label={t("sheetLabel")}
        className="w-full rounded-sm bg-white px-5 py-6 font-cv text-[0.95rem] leading-relaxed wrap-anywhere text-neutral-900 shadow-card ring-1 ring-border sm:px-10 sm:py-10 md:text-base"
      >
        <Section
          editLabel={t("headerLabel")}
          {...section("header")}
          view={<HeaderView header={content.header} />}
          editor={
            <HeaderEditor
              header={content.header}
              onChange={(header) => change({ ...content, header })}
            />
          }
        />
        <Section
          title={sectionTitles.summary}
          editLabel={sectionTitles.summary}
          {...section("summary")}
          view={
            <>
              {content.summary ? (
                <p className="whitespace-pre-line">{content.summary}</p>
              ) : (
                empty(t("empty.summary"))
              )}
              <div lang={uiLocale}>
                <ImproveSummary
                  cvId={cvId}
                  history={summaryHistory}
                  disabled={!saved}
                  onChoose={(summary) => change({ ...content, summary })}
                  topUp={topUp}
                />
              </div>
            </>
          }
          editor={
            <SummaryEditor
              summary={content.summary}
              onChange={(summary) => change({ ...content, summary })}
            />
          }
        />
        <Section
          title={sectionTitles.experiences}
          editLabel={sectionTitles.experiences}
          {...section("experiences")}
          view={
            content.experiences.length ? (
              <ExperiencesView
                items={content.experiences}
                action={(item) =>
                  item.bullets.length > 0 ? (
                    <div lang={uiLocale}>
                      <ImproveExperience
                        cvId={cvId}
                        experience={item}
                        disabled={!saved}
                        topUp={topUp}
                        onReplace={(proposal) =>
                          change({
                            ...content,
                            experiences: content.experiences.map((current) =>
                              current.id === proposal.id ? proposal : current,
                            ),
                          })
                        }
                      />
                    </div>
                  ) : null
                }
              />
            ) : (
              empty(t("empty.experiences"))
            )
          }
          editor={
            <ExperiencesEditor
              items={content.experiences}
              onChange={(experiences) => change({ ...content, experiences })}
            />
          }
        />
        <Section
          title={sectionTitles.skills}
          editLabel={sectionTitles.skills}
          {...section("skills")}
          view={
            content.skills.length ? (
              <p>{content.skills.join(" · ")}</p>
            ) : (
              empty(t("empty.skills"))
            )
          }
          editor={
            <SkillsEditor
              skills={content.skills}
              onChange={(skills) => change({ ...content, skills })}
            />
          }
        />
        <Section
          title={sectionTitles.education}
          editLabel={sectionTitles.education}
          {...section("education")}
          view={
            content.education.length ? (
              <EducationView items={content.education} />
            ) : (
              empty(t("empty.education"))
            )
          }
          editor={
            <EducationEditor
              items={content.education}
              onChange={(education) => change({ ...content, education })}
            />
          }
        />
        <Section
          title={sectionTitles.languages}
          editLabel={sectionTitles.languages}
          {...section("languages")}
          view={
            content.languages.length ? (
              <LanguagesView items={content.languages} />
            ) : (
              empty(t("empty.languages"))
            )
          }
          editor={
            <LanguagesEditor
              items={content.languages}
              onChange={(languages) => change({ ...content, languages })}
            />
          }
        />
      </article>
    </div>
  );
}
