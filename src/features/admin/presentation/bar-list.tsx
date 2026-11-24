import { formatShare } from "../format";
import { Empty } from "./ui";

export type BarItem = { label: string; value: number; display: string };

/**
 * Répartition en barres horizontales (part d'un total) : libellé, barre proportionnelle, valeur
 * et pourcentage écrits en clair. Les éléments au-delà de `limit` sont regroupés en « Autres ».
 */
export function BarList({
  items,
  limit = 8,
  formatOther,
}: {
  items: BarItem[];
  limit?: number;
  formatOther?: (value: number) => string;
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  if (rest.length > 0) {
    const value = rest.reduce((total, item) => total + item.value, 0);
    shown.push({
      label: `Autres (${rest.length})`,
      value,
      display: formatOther ? formatOther(value) : String(value),
    });
  }
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...shown.map((item) => item.value), 0);
  if (shown.length === 0 || total === 0) {
    return <Empty>Aucune donnée sur la période.</Empty>;
  }

  return (
    <ul className="grid gap-3">
      {shown.map((item) => (
        <li key={item.label} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{item.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {item.display}
              <span className="ml-2 inline-block w-14 text-right">
                {formatShare(item.value, total)}
              </span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-2 rounded-full bg-[#2a78d6]"
              style={{
                width: `${max > 0 ? Math.max((item.value / max) * 100, 1) : 0}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
