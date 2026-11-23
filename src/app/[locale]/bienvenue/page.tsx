import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import {
  BRAND_POINTS,
  BrandAside,
  SPLIT_LAYOUT,
} from "@/components/layout/brand-aside";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { localizedPath, safeNextPath } from "@/features/auth/paths";
import { requireUser } from "@/features/auth/session";
import { getOwnProfile } from "@/features/profile/data/profile-repository";
import { namesFromMetadata } from "@/features/profile/names";
import { WelcomeForm } from "@/features/profile/presentation/welcome-form";
import { pickClientMessages } from "@/i18n/client-messages";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("welcome");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Étape de première connexion : prénom et nom, pré-remplis avec Google (US-04 c.2).
export default async function WelcomePage({
  searchParams,
}: PageProps<"/[locale]/bienvenue">) {
  const t = await getTranslations("welcome");
  const tHome = await getTranslations("home");

  return (
    <div className="container-page py-12 md:py-16">
      <div className={SPLIT_LAYOUT}>
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-8">
            <Suspense fallback={<FormSkeleton fields={2} />}>
              <Appear>
                <Welcome searchParams={searchParams} />
              </Appear>
            </Suspense>
          </div>
        </div>
        <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
      </div>
    </div>
  );
}

async function Welcome({
  searchParams,
}: Pick<PageProps<"/[locale]/bienvenue">, "searchParams">) {
  const locale = await getLocale();
  const next =
    safeNextPath((await searchParams).next) ?? localizedPath(locale, "/compte");
  const user = await requireUser(locale, "/bienvenue");
  const profile = await getOwnProfile(await createClient(), user.id);
  // Nom déjà renseigné : l'étape n'a plus lieu d'être.
  if (profile.first_name) redirect(next);

  const messages = await pickClientMessages(["profile", "welcome", "errors"]);
  return (
    <NextIntlClientProvider messages={messages}>
      <WelcomeForm defaults={namesFromMetadata(user.metadata)} next={next} />
    </NextIntlClientProvider>
  );
}
