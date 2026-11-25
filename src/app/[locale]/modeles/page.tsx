import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { TemplateShowcase } from "@/features/marketing/presentation/template-showcase";
import { pickClientMessages } from "@/i18n/client-messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata() {
  const t = await getTranslations("templatesPage");
  return pageMetadata({
    pathname: "/modeles",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

// Modèles de CV par pays (Inc-15) : page publique, utile au référencement (« modèle de CV
// Allemagne… »). Un modèle choisi est donné au CV créé ensuite.
export default async function TemplatesPage() {
  const [t, messages] = await Promise.all([
    getTranslations("templatesPage"),
    pickClientMessages(["cvTemplates"]),
  ]);
  return (
    <div className="container-page grid gap-8 py-12 md:py-16">
      <div className="grid gap-4">
        <h1 className="text-[2rem] leading-[1.15] font-bold md:text-5xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("intro")}</p>
        <p className="font-medium">{t("choose")}</p>
      </div>
      <NextIntlClientProvider messages={messages}>
        <TemplateShowcase />
      </NextIntlClientProvider>
    </div>
  );
}
