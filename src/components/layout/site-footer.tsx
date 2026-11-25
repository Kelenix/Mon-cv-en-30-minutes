import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import logoBadgeFr from "@/assets/brand/logo-badge-fr.png";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LanguageSwitcher } from "./language-switcher";

const FOOTER_LINKS = [
  { href: "/tarifs", label: "pricing" },
  { href: "/modeles", label: "templates" },
  { href: "/mentions-legales", label: "legalNotice" },
  { href: "/cgv", label: "terms" },
  { href: "/confidentialite", label: "privacy" },
  { href: "/cookies", label: "cookies" },
] as const satisfies readonly { href: AppPathname; label: string }[];

/** `cookieChoices` : lien « Gérer les cookies » quand des publicités sont possibles (US-32 c.3). */
export function SiteFooter({ cookieChoices }: { cookieChoices?: ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        {/* Logo en badge (ADR-046), en français seulement : son texte n'est pas traduit. */}
        {locale === "fr" ? (
          <Link href="/" className="inline-flex shrink-0 self-start rounded-md">
            <Image
              src={logoBadgeFr}
              alt={t("brand.name")}
              sizes="7rem"
              className="h-auto w-28"
            />
          </Link>
        ) : null}
        <div className="flex flex-col gap-4 md:mr-auto">
          <nav aria-label={t("nav.legal")}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm text-foreground underline-offset-4 hover:underline"
                  >
                    {t(`nav.${link.label}`)}
                  </Link>
                </li>
              ))}
              {cookieChoices ? <li>{cookieChoices}</li> : null}
            </ul>
          </nav>
          <p className="text-sm text-muted-foreground">© {t("brand.name")}</p>
        </div>
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
