import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Briques de mise en page de l'administration : en-tête de page, panneaux, tuiles de chiffres.

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-card p-5 md:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Chiffre clé : libellé, valeur, précision facultative. */
export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold break-words tabular-nums sm:text-2xl md:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {children}
    </div>
  );
}

export function PanelGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 xl:grid-cols-2">{children}</div>;
}

/** Tableau de données : défile horizontalement sur petit écran, sans faire déborder la page. */
export function DataTable({
  caption,
  head,
  children,
}: {
  caption: string;
  head: string[];
  children: ReactNode;
}) {
  return (
    <div
      className="relative overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label={caption}
    >
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            {head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="px-3 py-2 font-medium whitespace-nowrap first:pl-0"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border [&_td]:px-3 [&_td]:py-2.5 [&_td:first-child]:pl-0">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-muted-foreground">{children}</p>;
}
