import Image, { type StaticImageData } from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import logoFr from "@/assets/brand/logo-fr.png";
import logoIcon from "@/assets/brand/logo-icone.png";

// Hauteur d'affichage (px) sur ordinateur ; les fichiers sources, détourés du kit fourni, sont
// redimensionnés par Next.js (ADR-023).
const HEIGHT = 56;

function scaledWidth(image: StaticImageData) {
  return Math.round((image.width * HEIGHT) / image.height);
}

// Logo : en français, le logo fourni à l'identique ; dans les autres langues, son icône suivie
// du nom traduit dans le même style (H31, choix de l'utilisateur).
export function Logo() {
  const locale = useLocale();
  const t = useTranslations("brand");

  if (locale === "fr") {
    return (
      <Link href="/" className="inline-flex shrink-0 rounded-md">
        <Image
          src={logoFr}
          alt={t("name")}
          width={scaledWidth(logoFr)}
          height={HEIGHT}
          loading="eager"
          className="h-11 w-auto sm:h-14"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md font-bold whitespace-nowrap text-foreground"
    >
      <Image
        src={logoIcon}
        alt=""
        width={scaledWidth(logoIcon)}
        height={HEIGHT}
        loading="eager"
        className="h-11 w-auto shrink-0 sm:h-14"
      />
      {/* Deux lignes, comme le logo fourni : le nom, puis le connecteur et la pastille. */}
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-lg leading-none sm:text-2xl">{t("lead")}</span>
        <span className="flex items-center gap-1 text-xs sm:text-sm">
          <span>{t("connector")}</span>
          <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground italic">
            {t("pill")}
          </span>
        </span>
      </span>
    </Link>
  );
}
