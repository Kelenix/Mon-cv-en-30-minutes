import { useTranslations } from "next-intl";

// Page d'accueil du socle (M0) ; la page complète (US-01 à US-03) arrive à l'Inc-1.
export default function HomePage() {
  const t = useTranslations("home");

  return (
    <section className="container-page py-16 md:py-24">
      <h1 className="max-w-3xl text-[2rem] leading-[1.15] font-bold md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
        {t("subtitle")}
      </p>
    </section>
  );
}
