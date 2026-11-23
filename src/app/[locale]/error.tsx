"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

// Les détails de l'erreur ne sont jamais affichés (messages muets, docs/architecture.md §12).
export default function ErrorBoundary({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("error");

  return (
    <section
      role="alert"
      className="container-page flex flex-col items-start gap-4 py-24"
    >
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button onClick={() => retry()}>{t("retry")}</Button>
    </section>
  );
}
