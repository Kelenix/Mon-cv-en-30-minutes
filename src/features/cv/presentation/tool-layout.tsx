import type { ReactNode } from "react";

/**
 * Disposition des outils IA du CV, en pleine largeur : formulaire et versions à gauche, résultat
 * à droite sur grand écran (état vide explicite avant la première génération) ; l'un sous
 * l'autre sur mobile.
 */
export function ToolLayout({
  controls,
  result,
  empty,
}: {
  controls: ReactNode;
  result: ReactNode;
  empty: string;
}) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="grid min-w-0 gap-8">{controls}</div>
      <div className="min-w-0">
        {result ?? (
          <p className="hidden min-h-72 place-content-center rounded-xl border-2 border-dashed border-border p-8 text-center text-lg text-muted-foreground lg:grid">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
}
