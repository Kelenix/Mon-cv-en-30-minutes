"use client";

import { useTranslations } from "next-intl";
import { CopyButton } from "@/features/cv/presentation/editing";

/** Exemple complet d'un article (lettre, CV), présenté comme une feuille et copiable. */
export function GuideExample({ title, text }: { title: string; text: string }) {
  const t = useTranslations("guides");
  return (
    <figure className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:p-6">
      <figcaption className="text-lg font-semibold">{title}</figcaption>
      <div className="rounded-lg bg-background p-4 text-[0.95rem] leading-relaxed whitespace-pre-line shadow-xs ring-1 ring-border md:p-6">
        {text}
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton getText={() => text} label={t("copyExample")} />
      </div>
    </figure>
  );
}
