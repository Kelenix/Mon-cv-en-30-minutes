import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { AccountNav, AccountNavFallback } from "./account-nav";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="border-b border-border bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-2 sm:gap-4 lg:h-20">
        <Logo />
        <nav
          aria-label={t("main")}
          className="flex items-center gap-1 lg:gap-2 lg:[&_a]:text-lg lg:[&_button]:text-lg"
        >
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
          <Suspense fallback={<AccountNavFallback />}>
            <AccountNav />
          </Suspense>
          {/* Appel à l'action toujours visible sur ordinateur (§4.4). */}
          <Link
            href="/creer"
            className={cn(buttonVariants(), "ml-2 hidden lg:inline-flex")}
          >
            {t("createCv")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
