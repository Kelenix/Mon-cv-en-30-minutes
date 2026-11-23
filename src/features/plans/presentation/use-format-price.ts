import { useFormatter } from "next-intl";
import { centsToEuros } from "../catalog";

/** Prix en euros formaté selon la langue affichée (« 6,99 € », « €6.99 »…), H32. */
export function useFormatPrice() {
  const format = useFormatter();
  return (cents: number) =>
    format.number(centsToEuros(cents), { style: "currency", currency: "EUR" });
}
