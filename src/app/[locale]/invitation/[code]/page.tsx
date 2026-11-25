import { GiftIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import {
  BRAND_POINTS,
  BrandAside,
  SPLIT_LAYOUT,
} from "@/components/layout/brand-aside";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { SubmitButton } from "@/components/form/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { acceptInvitation } from "@/features/acquisition/actions";
import { referralCode } from "@/features/acquisition/cookies";
import { invitationExists } from "@/features/acquisition/referrals";
import { REFERRAL_CREDITS } from "@/features/acquisition/server";
import { getCurrentUser } from "@/features/auth/session";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("invitation");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Invitation d'un parrain (ADR-052) : le visiteur l'accepte, puis crée son CV. Réservée aux
// nouveaux comptes ; le parrain n'est pas nommé.
export default async function InvitationPage({
  params,
}: PageProps<"/[locale]/invitation/[code]">) {
  const tHome = await getTranslations("home");
  return (
    <div className="container-page py-12 md:py-16">
      <div className={SPLIT_LAYOUT}>
        <div>
          <GiftIcon aria-hidden="true" className="size-10 text-primary" />
          <Suspense fallback={<FormSkeleton fields={1} />}>
            <Appear>
              <Invitation params={params} />
            </Appear>
          </Suspense>
        </div>
        <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
      </div>
    </div>
  );
}

async function Invitation({
  params,
}: Pick<PageProps<"/[locale]/invitation/[code]">, "params">) {
  const locale = await getLocale();
  const t = await getTranslations("invitation");
  const code = referralCode((await params).code);
  const [user, exists] = await Promise.all([
    getCurrentUser(),
    code ? invitationExists(code) : false,
  ]);

  return (
    <>
      <h1 className="mt-4 text-[1.75rem] leading-tight font-bold md:text-4xl">
        {exists ? t("title", { credits: REFERRAL_CREDITS }) : t("unknownTitle")}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {user
          ? t("signedIn")
          : exists
            ? t("subtitle", { credits: REFERRAL_CREDITS })
            : t("unknown")}
      </p>
      <div className="mt-8">
        {user ? (
          <Link href="/compte" className={buttonVariants({ size: "lg" })}>
            {t("account")}
          </Link>
        ) : exists ? (
          <form action={acceptInvitation} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="code" value={code ?? ""} />
            <SubmitButton size="lg" className="w-full sm:w-fit">
              {t("accept")}
            </SubmitButton>
            <p className="text-sm text-muted-foreground">{t("cookieNote")}</p>
          </form>
        ) : (
          <Link href="/creer" className={buttonVariants({ size: "lg" })}>
            {t("create")}
          </Link>
        )}
      </div>
    </>
  );
}
