"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { BILLING_INTERVALS, type BillingInterval } from "../catalog";

type BillingToggleProps = {
  labels: Record<BillingInterval, string> & {
    group: string;
    yearlyHint: string;
  };
  children: ReactNode;
};

/**
 * Bascule Mensuel / Annuel (US-03). Les deux prix sont rendus côté serveur ; la bascule ne fait
 * que changer `data-interval`, que les cartes lisent pour afficher le bon prix.
 */
export function BillingToggle({ labels, children }: BillingToggleProps) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");

  return (
    <div data-interval={billingInterval} className="group/billing">
      <div
        role="group"
        aria-label={labels.group}
        className="inline-flex flex-wrap gap-1 rounded-full bg-surface p-1"
      >
        {BILLING_INTERVALS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={billingInterval === value}
            onClick={() => setBillingInterval(value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold transition-colors duration-150",
              billingInterval === value
                ? "bg-background text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {labels[value]}
            {value === "year" && (
              <span className="rounded-full bg-premium px-2 py-0.5 text-sm text-premium-foreground">
                {labels.yearlyHint}
              </span>
            )}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
