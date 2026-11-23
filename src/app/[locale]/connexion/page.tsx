import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  BRAND_POINTS,
  BrandAside,
  SPLIT_LAYOUT,
} from "@/components/layout/brand-aside";
import { env } from "@/core/env";
import { SignInForm } from "@/features/auth/presentation/sign-in-form";
import { pickClientMessages } from "@/i18n/client-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Connexion (US-04). Une personne déjà connectée est redirigée par le proxy.
export default async function SignInPage() {
  const t = await getTranslations("auth");
  const tHome = await getTranslations("home");
  const messages = await pickClientMessages(["auth", "errors"]);

  return (
    <div className="container-page py-12 md:py-16">
      <div className={SPLIT_LAYOUT}>
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-8">
            <NextIntlClientProvider messages={messages}>
              {/* Les paramètres d'adresse (`next`, `erreur`) sont lus dans le navigateur. */}
              <Suspense>
                <SignInForm googleEnabled={env.GOOGLE_AUTH_ENABLED} />
              </Suspense>
            </NextIntlClientProvider>
          </div>
        </div>
        <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
      </div>
    </div>
  );
}
