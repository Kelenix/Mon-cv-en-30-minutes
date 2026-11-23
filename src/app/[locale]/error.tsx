"use client";

import { useTranslations } from "next-intl";
import { BrandAside, SPLIT_LAYOUT } from "@/components/layout/brand-aside";
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
    <section role="alert" className="container-page py-12 md:py-16">
      <div className={SPLIT_LAYOUT}>
        <div className="flex flex-col items-start gap-4 lg:py-16">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
          <Button onClick={() => retry()}>{t("retry")}</Button>
        </div>
        <BrandAside />
      </div>
    </section>
  );
}
