"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileUpIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type DragEvent, useRef, useState } from "react";
import { useHydrated } from "@/components/form/use-hydrated";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AtsReport, AtsStatus } from "../analyze";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; report: AtsReport }
  | { status: "error"; code: string };

const ERRORS = ["NOT_PDF", "TOO_LARGE", "UNREADABLE", "RATE_LIMITED"];

const ICONS: Record<AtsStatus, typeof CheckCircle2Icon> = {
  pass: CheckCircle2Icon,
  warn: AlertTriangleIcon,
  fail: XCircleIcon,
};

const COLORS: Record<AtsStatus, string> = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-destructive",
};

/** Test ATS (ADR-052) : dépôt du PDF, note sur 100 et points à corriger. */
export function AtsChecker() {
  const t = useTranslations("atsCheck");
  const [state, setState] = useState<State>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // Un fichier choisi avant que la page soit interactive serait perdu.
  const hydrated = useHydrated();

  async function analyze(file: File | undefined) {
    if (!file) return;
    setState({ status: "loading" });
    const body = new FormData();
    body.set("cv", file);
    try {
      const response = await fetch("/api/ats", { method: "POST", body });
      const data = (await response.json()) as AtsReport | { error: string };
      setState(
        "error" in data
          ? { status: "error", code: data.error }
          : { status: "done", report: data },
      );
    } catch {
      setState({ status: "error", code: "generic" });
    }
    if (input.current) input.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void analyze(event.dataTransfer.files[0]);
  }

  const report = state.status === "done" ? state.report : null;
  const verdict = report
    ? report.score >= 80
      ? "good"
      : report.score >= 50
        ? "ok"
        : "low"
    : null;

  return (
    <div className="grid gap-6">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative grid cursor-pointer justify-items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-surface p-8 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/40 hover:border-primary",
          dragging && "border-primary bg-primary/10",
        )}
      >
        <FileUpIcon aria-hidden="true" className="size-10 text-primary" />
        <span className="text-lg font-semibold text-primary-strong">
          {t("choose")}
        </span>
        <span className="text-sm text-muted-foreground">{t("hint")}</span>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          // Invisible mais étendu à toute la zone : grande cible au doigt (WCAG 2.5.8).
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          disabled={!hydrated || state.status === "loading"}
          onChange={(event) => void analyze(event.target.files?.[0])}
        />
      </label>

      <div aria-live="polite" className="grid gap-6">
        {state.status === "loading" ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2Icon
              aria-hidden="true"
              className="size-5 motion-safe:animate-spin"
            />
            {t("analyzing")}
          </p>
        ) : null}

        {state.status === "error" ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-4 py-3 font-medium text-destructive"
          >
            {t(
              `errors.${ERRORS.includes(state.code) ? state.code : "generic"}` as "errors.generic",
            )}
          </p>
        ) : null}

        {report && verdict ? (
          <section
            aria-labelledby="resultat-ats"
            className="grid animate-in gap-5 rounded-2xl border border-border p-6 duration-300 fade-in-0 md:p-8"
          >
            <div className="grid gap-3">
              <h2 id="resultat-ats" className="text-xl font-semibold">
                {t("score")}
              </h2>
              <p className="text-5xl font-bold tabular-nums">
                {t("scoreValue", { score: report.score })}
              </p>
              <div
                aria-hidden="true"
                className="h-3 overflow-hidden rounded-full bg-surface"
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    verdict === "good"
                      ? "bg-success"
                      : verdict === "ok"
                        ? "bg-warning"
                        : "bg-destructive",
                  )}
                  style={{ width: `${report.score}%` }}
                />
              </div>
              <p className="text-lg">{t(`verdict.${verdict}`)}</p>
            </div>
            <ul className="grid gap-3">
              {report.checks.map((check) => {
                const Icon = ICONS[check.status];
                return (
                  <li key={check.id} className="flex gap-3">
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 size-5 shrink-0",
                        COLORS[check.status],
                      )}
                    />
                    <span>
                      <span className="sr-only">
                        {t(`status.${check.status}`)} :{" "}
                      </span>
                      {t(
                        `checks.${check.id}.${check.status}` as "checks.email.pass",
                        { words: report.words, pages: report.pages },
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div>
              <Button variant="outline" onClick={() => input.current?.click()}>
                {t("again")}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
