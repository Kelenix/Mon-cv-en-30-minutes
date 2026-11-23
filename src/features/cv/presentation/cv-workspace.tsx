"use client";

import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  PencilIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
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

type SaveStatus = "idle" | "saving" | "saved" | "error" | "invalid";
type SectionKey = "header" | keyof CvSectionTitles;

/**
 * Enregistrement automatique 1 s après la dernière modification (docs/system-design.md §7) ;
 * les envois partent dans l'ordre, et seule la dernière modification fixe l'indicateur.
 */
function useAutosave(cvId: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queue = useRef(Promise.resolve());
  const latest = useRef(0);

  // Avertissement du navigateur si l'on quitte la page avant l'enregistrement.
  const unsaved = status !== "idle" && status !== "saved";
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  function save(content: CvContent, delay = 1_000) {
    clearTimeout(timer.current);
    const attempt = ++latest.current;
    if (!cvContentSchema.safeParse(content).success) {
      setStatus("invalid");
      return;
    }
    // « Enregistrement… » dès la modification : jamais « Enregistré » tant qu'un envoi attend.
    setStatus("saving");
    timer.current = setTimeout(() => {
      queue.current = queue.current.then(async () => {
        const result = await updateCv({ cvId, content }).catch(() => null);
        if (attempt === latest.current) {
          setStatus(result?.ok ? "saved" : "error");
        }
      });
    }, delay);
  }

  return { status, save };
}

function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus;
  onRetry: () => void;
}) {
  const t = useTranslations("cvEditor.status");
  return (
    <div className="flex min-h-11 items-center gap-2 text-sm">
      <p role="status" className="flex items-center gap-1.5">
        {status === "saving" ? (
          <>
            <Loader2Icon
              aria-hidden="true"
              className="size-4 motion-safe:animate-spin"
            />
            {t("saving")}
          </>
        ) : status === "saved" ? (
          <>
            <CheckIcon aria-hidden="true" className="size-4 text-success" />
            {t("saved")}
          </>
        ) : status === "error" || status === "invalid" ? (
          <span className="flex items-center gap-1.5 font-medium text-destructive">
            <AlertCircleIcon aria-hidden="true" className="size-4" />
            {t(status)}
          </span>
        ) : null}
      </p>
      {status === "error" ? (
        <Button variant="ghost" onClick={onRetry}>
          <RotateCcwIcon aria-hidden="true" />
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}

function CopyButton({ getText }: { getText: () => string }) {
  const t = useTranslations("cvEditor");
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 3_000);
  }

  return (
    <>
      <Button variant="outline" onClick={() => void copy()}>
        {state === "copied" ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        {state === "copied" ? t("copied") : t("copy")}
      </Button>
      <p
        role="status"
        className={
          state === "failed" ? "basis-full text-sm text-destructive" : "sr-only"
        }
      >
        {state === "copied"
          ? t("copied")
          : state === "failed"
            ? t("copyFailed")
            : ""}
      </p>
    </>
  );
}

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
 * Aperçu et éditeur du CV (US-12 à US-14) : feuille sur une colonne dans la langue du CV, chaque
 * rubrique modifiable sur place, enregistrement automatique gratuit, copie du texte.
 */
export function CvWorkspace({
  cvId,
  title,
  language,
  initialContent,
  sectionTitles,
}: {
  cvId: string;
  title: string;
  language: AppLocale;
  initialContent: CvContent;
  sectionTitles: CvSectionTitles;
}) {
  const t = useTranslations("cvEditor");
  const uiLocale = useLocale();
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const { status, save } = useAutosave(cvId);

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
    <div className="mx-auto grid w-full max-w-[52rem] min-w-0 gap-4">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <h1 className="me-auto min-w-0 truncate text-lg font-bold md:text-xl">
          {title}
        </h1>
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
            content.summary ? (
              <p className="whitespace-pre-line">{content.summary}</p>
            ) : (
              empty(t("empty.summary"))
            )
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
              <ExperiencesView items={content.experiences} />
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
