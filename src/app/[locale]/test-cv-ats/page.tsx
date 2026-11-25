import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AtsChecker } from "@/features/ats/presentation/ats-checker";
import { GuideCta } from "@/features/guides/presentation/guide-cta";
import { pickClientMessages } from "@/i18n/client-messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata() {
  const t = await getTranslations("atsCheck");
  return pageMetadata({
    pathname: "/test-cv-ats",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

const TIPS = ["tip1", "tip2", "tip3", "tip4", "tip5"] as const;
const FAQ = ["1", "2", "3", "4"] as const;

// Test ATS gratuit (ADR-052) : outil sans compte ni IA, utile au référencement (« test CV ATS »),
// qui mène à la création du CV.
export default async function AtsCheckPage() {
  const [t, messages] = await Promise.all([
    getTranslations("atsCheck"),
    pickClientMessages(["atsCheck"]),
  ]);

  return (
    <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="grid min-w-0 gap-10">
        <header className="grid gap-4">
          <h1 className="text-[2rem] leading-[1.15] font-bold md:text-5xl">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            {t("intro")}
          </p>
          <p className="text-sm text-muted-foreground">{t("privacy")}</p>
        </header>

        <NextIntlClientProvider messages={messages}>
          <AtsChecker />
        </NextIntlClientProvider>

        <div className="grid gap-10 text-[1.0625rem] leading-relaxed">
          <section aria-labelledby="ats-definition" className="grid gap-4">
            <h2
              id="ats-definition"
              className="text-2xl leading-tight font-bold md:text-3xl"
            >
              {t("aboutTitle")}
            </h2>
            <p>{t("aboutText")}</p>
          </section>
          <section aria-labelledby="ats-controles" className="grid gap-4">
            <h2
              id="ats-controles"
              className="text-2xl leading-tight font-bold md:text-3xl"
            >
              {t("checksTitle")}
            </h2>
            <p>{t("checksText")}</p>
          </section>
          <section aria-labelledby="ats-conseils" className="grid gap-4">
            <h2
              id="ats-conseils"
              className="text-2xl leading-tight font-bold md:text-3xl"
            >
              {t("tipsTitle")}
            </h2>
            <ul className="grid list-disc gap-2 pl-6">
              {TIPS.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="ats-questions" className="grid gap-5">
            <h2
              id="ats-questions"
              className="text-2xl leading-tight font-bold md:text-3xl"
            >
              {t("faqTitle")}
            </h2>
            {FAQ.map((index) => (
              <div key={index} className="grid gap-1">
                <h3 className="text-lg font-semibold">{t(`q${index}`)}</h3>
                <p>{t(`a${index}`)}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
      <GuideCta kind="cv" className="lg:sticky lg:top-6" />
    </div>
  );
}
