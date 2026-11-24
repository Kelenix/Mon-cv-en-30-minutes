import { cn } from "@/lib/utils";

// Chargement des pages de l'administration : même disposition que le contenu, visible seulement
// si le chargement dure (`skeleton-appear`, docs/design/design-system.md §5).
const BAR = "rounded-2xl bg-card motion-safe:animate-pulse";

export function DashboardSkeleton({ tiles = 8 }: { tiles?: number }) {
  return (
    <div aria-hidden="true" className="mt-8 grid skeleton-appear gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: tiles }, (_, index) => (
          <div key={index} className={cn(BAR, "h-28")} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className={cn(BAR, "h-80")} />
        <div className={cn(BAR, "h-80")} />
      </div>
    </div>
  );
}
