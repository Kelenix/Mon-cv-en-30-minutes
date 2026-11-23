import { type ReactNode, ViewTransition } from "react";

/**
 * Contenu chargé en flux : il apparaît en fondu quand il remplace le chargement
 * (docs/design/design-system.md §5) ; aucune animation ensuite, lors des actions dans la page.
 */
export function Appear({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" default="none">
      {children}
    </ViewTransition>
  );
}
