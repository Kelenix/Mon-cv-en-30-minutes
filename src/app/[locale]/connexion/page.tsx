import { FileCheckIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
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
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("metaTitle"), robots: { index: false } };
}

/** Ce que le compte apporte, sous le formulaire : la colonne reste à la hauteur de l'illustration. */
const BENEFITS = [
  { key: "saved", Icon: FileCheckIcon },
  { key: "tools", Icon: SparklesIcon },
  { key: "privacy", Icon: ShieldCheckIcon },
] as const;

const INLINE_LINK =
  "font-medium text-primary-strong underline underline-offset-4 hover:text-foreground";

// Connexion (US-04). Une personne déjà connectée est redirigée par le proxy.
export default async function SignInPage() {
  const t = await getTranslations("auth");
  const tHome = await getTranslations("home");
  const messages = await pickClientMessages(["auth", "errors"]);

  return (
    <div className="container-page py-12 md:py-16">
      <div className={SPLIT_LAYOUT}>
        <div className="lg:self-center">
          <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-8">
            <NextIntlClientProvider messages={messages}>
              {/* Les paramètres d'adresse (`next`, `erreur`) sont lus dans le navigateur. */}
              <Suspense>
                <SignInForm
                  googleEnabled={env.GOOGLE_AUTH_ENABLED}
                  turnstileSiteKey={env.TURNSTILE_SITE_KEY ?? null}
                />
              </Suspense>
            </NextIntlClientProvider>
          </div>
          <ul className="mt-10 grid gap-5 border-t border-border pt-8">
            {BENEFITS.map(({ key, Icon }) => (
              <li key={key} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{t(`benefits.${key}.title`)}</p>
                  <p className="text-muted-foreground">
                    {t(`benefits.${key}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            {t.rich("terms", {
              terms: (chunks) => (
                <Link href="/cgv" className={INLINE_LINK}>
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/confidentialite" className={INLINE_LINK}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
        <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
      </div>
    </div>
  );
}
