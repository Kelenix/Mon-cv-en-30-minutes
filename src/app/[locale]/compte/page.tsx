import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/form/form-skeleton";
import { SubmitButton } from "@/components/form/submit-button";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";
import { PlanAndCredits } from "@/features/credits/presentation/plan-and-credits";
import { getCurrentWallet } from "@/features/credits/wallet";
import { getOwnProfile } from "@/features/profile/data/profile-repository";
import { DeleteAccountDialog } from "@/features/profile/presentation/delete-account-dialog";
import { ProfileForm } from "@/features/profile/presentation/profile-form";
import { pickClientMessages } from "@/i18n/client-messages";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Espace compte (US-05, US-06, US-07, docs/design/flows.md §3.10) : informations, formule et
// crédits, déconnexion, suppression.
export default async function AccountPage() {
  const t = await getTranslations("account");

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
          {t("title")}
        </h1>
        <Suspense fallback={<FormSkeleton fields={4} />}>
          <AccountContent />
        </Suspense>
      </div>
    </div>
  );
}

async function AccountContent() {
  const locale = await getLocale();
  const t = await getTranslations("account");
  const user = await requireUser(locale, "/compte");
  const profile = await getOwnProfile(await createClient(), user.id);
  const wallet = await getCurrentWallet();
  const messages = await pickClientMessages(["profile", "account", "errors"]);

  return (
    <NextIntlClientProvider messages={messages}>
      <section aria-labelledby="informations" className="mt-10">
        <h2 id="informations" className="text-xl font-semibold">
          {t("infoTitle")}
        </h2>
        <p className="mt-1 text-muted-foreground">{t("infoHint")}</p>
        <dl className="mt-6">
          <dt className="font-medium">{t("email")}</dt>
          <dd className="mt-1 break-all">{user.email}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">
            {t("emailHint")}
          </dd>
        </dl>
        <div className="mt-6">
          <ProfileForm
            initialValues={{
              firstName: profile.first_name ?? "",
              lastName: profile.last_name ?? "",
              phone: profile.phone ?? "",
              city: profile.city ?? "",
            }}
          />
        </div>
      </section>

      {wallet ? <PlanAndCredits wallet={wallet} /> : null}

      <form action={signOut} className="mt-10 border-t border-border pt-8">
        <input type="hidden" name="locale" value={locale} />
        <SubmitButton variant="outline">
          <LogOutIcon aria-hidden="true" />
          {t("signOut")}
        </SubmitButton>
      </form>

      <section
        aria-labelledby="zone-sensible"
        className="mt-10 border-t border-border pt-8"
      >
        <h2 id="zone-sensible" className="text-xl font-semibold">
          {t("dangerTitle")}
        </h2>
        <div className="mt-4">
          <DeleteAccountDialog />
        </div>
      </section>
    </NextIntlClientProvider>
  );
}
