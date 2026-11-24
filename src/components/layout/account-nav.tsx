import {
  FileTextIcon,
  LogInIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { isAdminEmail } from "@/features/admin/admins";
import { getCurrentUser } from "@/features/auth/session";
import { CreditsBadge } from "@/features/credits/presentation/credits-badge";
import { getCurrentWallet } from "@/features/credits/wallet";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";

const linkClass = cn(buttonVariants({ variant: "ghost" }), "px-3");
/** Liens remplacés par le menu sur mobile, faute de place. */
const desktopLinkClass = cn(linkClass, "hidden sm:inline-flex");

/**
 * Partie « compte » de l'en-tête, lue à la requête : « Se connecter » pour un visiteur ; « Mes
 * CV », solde de crédits (US-07) et « Mon compte » pour une personne connectée (sur mobile, le
 * solde et un menu). Un administrateur n'a que le lien vers l'administration : pas d'espace
 * compte (ADR-040).
 */
export async function AccountNav() {
  const t = await getTranslations();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/connexion" className={linkClass}>
        <LogInIcon aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{t("nav.signIn")}</span>
      </Link>
    );
  }

  if (isAdminEmail(user.email)) {
    // Hors du routage par langue : lien Next.js simple, vers /admin.
    return (
      <NextLink href="/admin" className={linkClass}>
        <ShieldCheckIcon aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{t("nav.admin")}</span>
      </NextLink>
    );
  }

  const wallet = await getCurrentWallet();
  return (
    <>
      <Link href="/cv" className={desktopLinkClass}>
        <FileTextIcon aria-hidden="true" />
        {t("nav.myCvs")}
      </Link>
      {wallet ? (
        <CreditsBadge
          wallet={wallet}
          labels={{
            trigger: t("credits.balanceLabel", { count: wallet.total }),
            title: t("credits.title"),
            included: t("credits.included"),
            includedHint: t("credits.includedHint"),
            purchased: t("credits.purchased"),
            purchasedHint: t("credits.purchasedHint"),
            topUp: t("credits.topUp"),
          }}
        />
      ) : null}
      <Link href="/compte" className={desktopLinkClass}>
        <UserRoundIcon aria-hidden="true" />
        {t("nav.account")}
      </Link>
      <div className="sm:hidden">
        <AccountMenu
          labels={{
            menu: t("nav.menu"),
            myCvs: t("nav.myCvs"),
            account: t("nav.account"),
            createCv: t("nav.createCv"),
            pricing: t("nav.pricing"),
          }}
        />
      </div>
    </>
  );
}

/** Réserve la place pendant la lecture de la session (aucun décalage de mise en page). */
export function AccountNavFallback() {
  return <span aria-hidden="true" className="inline-block h-11 w-11 sm:w-36" />;
}
