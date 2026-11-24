import { useTranslations } from "next-intl";
import { type OperationKey, OPERATION_COSTS } from "../catalog";

const OPERATIONS = Object.keys(OPERATION_COSTS) as OperationKey[];

// Coût de chaque opération IA (INTAKE §11.1), affiché avant tout achat (US-08 critère 1).
export function OperationCosts() {
  const t = useTranslations("pricing.costs");

  return (
    <section aria-labelledby="couts" className="mt-20">
      <h2
        id="couts"
        className="text-[1.625rem] leading-tight font-bold md:text-3xl"
      >
        {t("title")}
      </h2>
      <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
      <div
        role="region"
        aria-labelledby="couts"
        tabIndex={0}
        className="relative mt-6 overflow-x-auto rounded-xl border border-border"
      >
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{t("title")}</caption>
          <thead className="bg-surface">
            <tr>
              <th scope="col" className="p-4 font-semibold">
                {t("operation")}
              </th>
              <th scope="col" className="p-4 text-right font-semibold">
                {t("cost")}
              </th>
            </tr>
          </thead>
          <tbody>
            {OPERATIONS.map((operation) => (
              <tr key={operation} className="border-t border-border">
                <th scope="row" className="p-4 font-medium">
                  {t(`items.${operation}`)}
                </th>
                <td className="p-4 text-right font-semibold whitespace-nowrap">
                  {t("credits", { count: OPERATION_COSTS[operation] })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
