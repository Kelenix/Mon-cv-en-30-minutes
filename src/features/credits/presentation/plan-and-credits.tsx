import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Wallet } from "../wallet";

/**
 * Formule et crédits dans l'espace compte (US-05 c.1, US-07 c.3). Les abonnements arrivent à
 * l'Inc-6 : d'ici là, aucun compte n'a de formule, d'où « Aucun abonnement ».
 */
export function PlanAndCredits({ wallet }: { wallet: Wallet }) {
  const t = useTranslations();

  return (
    <section
      aria-labelledby="formule-credits"
      className="mt-10 border-t border-border pt-8"
    >
      <h2 id="formule-credits" className="text-xl font-semibold">
        {t("account.planTitle")}
      </h2>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="font-medium">{t("account.plan")}</dt>
          <dd className="mt-1">{t("account.noPlan")}</dd>
        </div>
        <div>
          <dt className="font-medium">{t("account.totalCredits")}</dt>
          <dd className="mt-1">
            {t("credits.count", { count: wallet.total })}
          </dd>
        </div>
        <div>
          <dt className="font-medium">{t("credits.included")}</dt>
          <dd className="mt-1">{wallet.included}</dd>
        </div>
        <div>
          <dt className="font-medium">{t("credits.purchased")}</dt>
          <dd className="mt-1">{wallet.purchased}</dd>
        </div>
      </dl>
      <Link
        href="/tarifs"
        className={`${buttonVariants({ variant: "outline" })} mt-6`}
      >
        {t("account.seeOffers")}
      </Link>
    </section>
  );
}
