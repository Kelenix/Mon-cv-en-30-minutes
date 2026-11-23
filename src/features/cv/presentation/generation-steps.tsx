import { CheckCircle2Icon, CircleIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STEPS = ["analysis", "writing", "formatting"] as const;

/**
 * Étapes de la génération (US-11 c.3) : affichées dès le premier rendu de la page, l'étape en
 * cours annoncée aux lecteurs d'écran.
 */
export function GenerationSteps({ current }: { current: number }) {
  const t = useTranslations("generation");

  return (
    <div className="grid gap-6">
      <ol className="grid gap-4">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className={cn(
              "flex items-center gap-3 text-lg",
              index === current && "font-semibold",
              index > current && "text-muted-foreground",
            )}
          >
            {index < current ? (
              <CheckCircle2Icon
                aria-hidden="true"
                className="size-6 text-primary"
              />
            ) : index === current ? (
              <Loader2Icon
                aria-hidden="true"
                className="size-6 text-primary motion-safe:animate-spin"
              />
            ) : (
              <CircleIcon aria-hidden="true" className="size-6" />
            )}
            {t(`steps.${step}`)}
          </li>
        ))}
      </ol>
      <p role="status" className="sr-only">
        {t(`steps.${STEPS[current]}`)}
      </p>
      <p className="text-muted-foreground">{t("wait")}</p>
    </div>
  );
}
