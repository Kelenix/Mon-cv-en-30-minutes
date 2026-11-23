import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="border-b border-border bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label={t("main")} className="flex items-center gap-1">
          {/* Sur mobile, le lien Tarifs reste accessible depuis le pied de page. */}
          <Link
            href="/tarifs"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden px-4 sm:inline-flex",
            )}
          >
            {t("pricing")}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
