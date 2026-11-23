import { LogInIcon, UserRoundIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "../session";

const linkClass = cn(buttonVariants({ variant: "ghost" }), "px-3");

/** Lien « Se connecter » ou « Mon compte » de l'en-tête ; lit la session (rendu à la requête). */
export async function AuthNavLink() {
  const t = await getTranslations("nav");
  const user = await getCurrentUser();

  return user ? (
    <Link href="/compte" className={linkClass}>
      <UserRoundIcon aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{t("account")}</span>
    </Link>
  ) : (
    <Link href="/connexion" className={linkClass}>
      <LogInIcon aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{t("signIn")}</span>
    </Link>
  );
}

/** Réserve la place du lien pendant la lecture de la session (aucun décalage de mise en page). */
export function AuthNavLinkFallback() {
  return <span aria-hidden="true" className="inline-block h-11 w-11 sm:w-36" />;
}
