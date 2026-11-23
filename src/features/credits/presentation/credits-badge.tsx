"use client";

import { ZapIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Wallet } from "../wallet";

type CreditsBadgeProps = {
  wallet: Wallet;
  labels: {
    /** Fin du nom accessible du bouton, après le nombre (ex. « crédits, voir le détail »). */
    trigger: string;
    title: string;
    included: string;
    includedHint: string;
    purchased: string;
    purchasedHint: string;
    topUp: string;
  };
};

/** Solde total dans l'en-tête ; un clic détaille crédits inclus et achetés (US-07 c.1). */
export function CreditsBadge({ wallet, labels }: CreditsBadgeProps) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "px-3")}
      >
        <ZapIcon aria-hidden="true" className="text-primary" />
        <span>{wallet.total}</span>
        <span className="sr-only">{labels.trigger}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-3 p-4 text-base">
        <PopoverTitle className="text-base font-semibold">
          {labels.title}
        </PopoverTitle>
        <dl className="grid gap-3">
          {[
            [labels.included, wallet.included, labels.includedHint],
            [labels.purchased, wallet.purchased, labels.purchasedHint],
          ].map(([label, value, hint]) => (
            <div
              key={label}
              className="grid grid-cols-[1fr_auto] gap-x-4 font-medium"
            >
              <dt>{label}</dt>
              <dd>{value}</dd>
              <dd className="col-span-2 text-sm font-normal text-muted-foreground">
                {hint}
              </dd>
            </div>
          ))}
        </dl>
        <Link
          href="/compte/credits"
          className={buttonVariants({ variant: "outline" })}
        >
          {labels.topUp}
        </Link>
      </PopoverContent>
    </Popover>
  );
}
