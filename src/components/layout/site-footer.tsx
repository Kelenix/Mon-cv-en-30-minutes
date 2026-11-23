import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export function SiteFooter() {
  const t = useTranslations("brand");

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">© {t("name")}</p>
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
