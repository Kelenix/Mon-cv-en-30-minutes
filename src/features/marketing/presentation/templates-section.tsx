import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { pickClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";
import { TemplateShowcase } from "./template-showcase";

/** Section « Un modèle de CV pour chaque pays » de l'accueil (Inc-15). */
export async function TemplatesSection() {
  const [t, messages] = await Promise.all([
    getTranslations("home.templates"),
    pickClientMessages(["cvTemplates"]),
  ]);
  return (
    <section
      aria-labelledby="modeles"
      className="container-page grid gap-8 py-16 md:py-24"
    >
      <div className="grid gap-3">
        <h2
          id="modeles"
          className="text-[1.75rem] leading-tight font-bold md:text-4xl"
        >
          {t("title")}
        </h2>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
      </div>
      <NextIntlClientProvider messages={messages}>
        <TemplateShowcase />
      </NextIntlClientProvider>
      <Link
        href="/modeles"
        className={buttonVariants({
          variant: "outline",
          className: "justify-self-start",
        })}
      >
        {t("seeAll")}
      </Link>
    </section>
  );
}
