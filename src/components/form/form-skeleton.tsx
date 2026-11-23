import { cn } from "@/lib/utils";

// Squelettes de chargement (US-37) : même disposition que le contenu attendu, visibles seulement
// si le chargement dépasse 700 ms (`skeleton-appear`, docs/design/design-system.md §5).

const BAR = "rounded bg-surface motion-safe:animate-pulse";

/** Champs d'un formulaire et son bouton. */
export function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden="true" className="grid skeleton-appear gap-5">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="grid gap-2">
          <div className={cn(BAR, "h-4 w-24")} />
          <div className={cn(BAR, "h-11 rounded-lg")} />
        </div>
      ))}
      <div className={cn(BAR, "h-11 w-40 rounded-full")} />
    </div>
  );
}

/** Deux colonnes : formulaire à gauche, bloc à droite (outils du CV, compte, crédits). */
export function SplitSkeleton({
  fields,
  className,
}: {
  fields: number;
  /** Colonnes sur ordinateur (`lg:grid-cols-…`) et marges. */
  className: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("grid skeleton-appear items-start gap-8", className)}
    >
      <FormSkeleton fields={fields} />
      <div className={cn(BAR, "hidden min-h-72 rounded-2xl lg:block")} />
    </div>
  );
}
