import Link from "next/link";
import { cn } from "@/lib/utils";
import { PERIODS, type Period } from "../data";

const LABELS: Record<Period, string> = {
  7: "7 jours",
  30: "30 jours",
  90: "90 jours",
  365: "12 mois",
};

/** Choix de la période des statistiques (`?jours=`). */
export function PeriodTabs({
  pathname,
  current,
}: {
  pathname: string;
  current: Period;
}) {
  return (
    <nav aria-label="Période" className="justify-self-start">
      <ul className="flex rounded-full border border-border bg-card p-1">
        {PERIODS.map((days) => (
          <li key={days}>
            <Link
              href={`${pathname}?jours=${days}`}
              scroll={false}
              aria-current={days === current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors",
                days === current
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {LABELS[days]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
