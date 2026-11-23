"use client";

import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  RotateCcwIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/core/action-result";

// Outils d'édition communs au CV et aux contenus générés (LinkedIn, lettre) : enregistrement
// automatique, indicateur d'état, copie du texte.

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "invalid";

/**
 * Enregistrement automatique 1 s après la dernière modification (docs/system-design.md §7) ;
 * les envois partent dans l'ordre, et seule la dernière modification fixe l'indicateur ; le
 * navigateur prévient si l'on quitte la page avant l'enregistrement.
 */
export function useAutosave<Value>(
  send: (value: Value) => Promise<ActionResult<unknown>>,
  isValid: (value: Value) => boolean,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queue = useRef(Promise.resolve());
  const latest = useRef(0);

  const unsaved = status !== "idle" && status !== "saved";
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  function save(value: Value, delay = 1_000) {
    clearTimeout(timer.current);
    const attempt = ++latest.current;
    if (!isValid(value)) {
      setStatus("invalid");
      return;
    }
    // « Enregistrement… » dès la modification : jamais « Enregistré » tant qu'un envoi attend.
    setStatus("saving");
    timer.current = setTimeout(() => {
      queue.current = queue.current.then(async () => {
        const result = await send(value).catch(() => null);
        if (attempt === latest.current) {
          setStatus(result?.ok ? "saved" : "error");
        }
      });
    }, delay);
  }

  return { status, save, saved: status === "idle" || status === "saved" };
}

export function SaveIndicator({
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

/**
 * Copie dans le presse-papiers ; `label` distingue plusieurs boutons sur une page et commence
 * par le texte visible « Copier » (WCAG 2.5.3 : le nom accessible contient le texte affiché).
 */
export function CopyButton({
  getText,
  label,
}: {
  getText: () => string;
  label?: string;
}) {
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
      <Button
        variant="outline"
        aria-label={state === "copied" ? undefined : label}
        onClick={() => void copy()}
      >
        {state === "copied" ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        {state === "copied" ? t("copied") : label ? t("copyShort") : t("copy")}
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
