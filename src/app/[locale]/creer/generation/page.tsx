import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/credits/wallet";
import { GenerationScreen } from "@/features/cv/presentation/generation-screen";
import { GenerationSteps } from "@/features/cv/presentation/generation-steps";
import { listOwnCvs } from "@/features/cv/repository";
import { planEntitlements } from "@/features/plans/entitlements";
import { pickClientMessages } from "@/i18n/client-messages";

// Une génération peut durer deux tentatives de 60 s (docs/system-design.md §9).
export const maxDuration = 150;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("generation");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Génération du CV (US-11, docs/design/flows.md §3.5) : les étapes s'affichent immédiatement,
// puis l'écran lance la génération avec le brouillon du navigateur.
export default async function GenerationPage() {
  const t = await getTranslations("generation");

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 text-[1.75rem] leading-tight font-bold md:text-4xl">
          {t("title")}
        </h1>
        <Suspense fallback={<GenerationSteps current={0} />}>
          <Generation />
        </Suspense>
      </div>
    </div>
  );
}

async function Generation() {
  const locale = await getLocale();
  await requireUser(locale, "/creer/generation");
  const [cvs, plan, messages] = await Promise.all([
    listOwnCvs(),
    getActivePlan(),
    pickClientMessages(["generation", "errors"]),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <GenerationScreen cvs={cvs} cvLimit={planEntitlements(plan).cvLimit} />
    </NextIntlClientProvider>
  );
}
