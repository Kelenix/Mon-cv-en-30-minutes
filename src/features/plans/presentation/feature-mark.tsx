import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeatureValue } from "../catalog";

/** Une fonctionnalité est incluse si elle vaut vrai, une quantité ou une priorité réelle. */
export function isFeatureIncluded(value: FeatureValue): boolean {
  return value !== false && value !== "standard";
}

/** Coche ou croix, toujours accompagnée d'un texte pour les lecteurs d'écran. */
export function FeatureMark({ value }: { value: FeatureValue }) {
  const t = useTranslations("plans");
  const isIncluded = isFeatureIncluded(value);
  const Icon = isIncluded ? CheckIcon : XIcon;

  return (
    <>
      <Icon
        aria-hidden="true"
        className={
          isIncluded
            ? "size-5 shrink-0 text-success"
            : "size-5 shrink-0 text-muted-foreground"
        }
      />
      <span className="sr-only">
        {isIncluded ? t("included") : t("notIncluded")}
      </span>
    </>
  );
}

/** Valeur lisible d'une quantité ou d'une priorité (« 5 », « Maximale »), sinon rien. */
export function useFeatureDetail() {
  const t = useTranslations("plans");
  return (value: FeatureValue): string | null => {
    if (typeof value === "number") return String(value);
    if (value === "priority" || value === "max") return t(`priority.${value}`);
    return null;
  };
}
