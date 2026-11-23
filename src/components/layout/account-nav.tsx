import { LogInIcon, UserRoundIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { CreditsBadge } from "@/features/credits/presentation/credits-badge";
import { getCurrentWallet } from "@/features/credits/wallet";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const linkClass = cn(buttonVariants({ variant: "ghost" }), "px-3");

/**
 * Partie « compte » de l'en-tête, lue à la requête : « Se connecter » pour un visiteur ; solde de
 * crédits (US-07) et « Mon compte » pour une personne connectée.
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

  const wallet = await getCurrentWallet();
  return (
    <>
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
      <Link href="/compte" className={linkClass}>
        <UserRoundIcon aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{t("nav.account")}</span>
      </Link>
    </>
  );
}

/** Réserve la place pendant la lecture de la session (aucun décalage de mise en page). */
export function AccountNavFallback() {
  return <span aria-hidden="true" className="inline-block h-11 w-11 sm:w-36" />;
}
