import { NextIntlClientProvider, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { CvWizard } from "@/features/cv/presentation/cv-wizard";
import { pickClientMessages } from "@/i18n/client-messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata() {
  const t = await getTranslations("wizard");
  return pageMetadata({
    pathname: "/creer",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

// Assistant des 5 questions (US-10) : page statique, réponses gardées dans le navigateur.
export default async function CreatePage() {
  const messages = await pickClientMessages(["wizard", "locales"]);

  return (
    <div className="container-page py-10 md:py-14">
      <Intro />
      <div className="mt-8">
        <NextIntlClientProvider messages={messages}>
          <CvWizard />
        </NextIntlClientProvider>
      </div>
    </div>
  );
}

function Intro() {
  const t = useTranslations("wizard");
  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{t("intro")}</p>
    </>
  );
}
