import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Logotype typographique traduit (H31), en attendant les fichiers du logo (tâche manuelle 8).
export function Logo() {
  const t = useTranslations("brand");

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 rounded-md text-base font-bold whitespace-nowrap text-foreground sm:text-lg"
    >
      <span>{t("lead")}</span>
      <span className="text-sm font-medium text-muted-foreground">
        {t("connector")}
      </span>
      <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm text-primary-foreground sm:text-base">
        {t("pill")}
      </span>
    </Link>
  );
}
