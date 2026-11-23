"use client";

import { Loader2Icon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useHydrated } from "@/components/form/use-hydrated";
import { Button } from "@/components/ui/button";
import type { BillingInterval, PlanTier } from "@/features/plans/catalog";
import type { CheckoutItem, ReturnTo } from "../stripe-mapping";
import { useCheckout } from "./use-checkout";

type ButtonProps = Pick<
  ComponentProps<typeof Button>,
  "variant" | "size" | "className"
>;

function CheckoutControl({
  onClick,
  busy,
  error,
  children,
  ...buttonProps
}: ButtonProps & {
  onClick: (button: HTMLButtonElement) => void;
  busy: boolean;
  error?: string;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  return (
    <div className="grid gap-2">
      <Button
        {...buttonProps}
        disabled={!hydrated || busy}
        aria-busy={busy || undefined}
        onClick={(event) => onClick(event.currentTarget)}
      >
        {busy ? (
          <Loader2Icon
            aria-hidden="true"
            className="motion-safe:animate-spin"
          />
        ) : null}
        {children}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Achat d'un pack ou d'un CV Pro (US-18, US-19). */
export function CheckoutButton({
  item,
  returnTo,
  children,
  ...buttonProps
}: ButtonProps & {
  item: CheckoutItem;
  returnTo?: ReturnTo;
  children: ReactNode;
}) {
  const { start, busy, error } = useCheckout();
  return (
    <CheckoutControl
      {...buttonProps}
      busy={busy}
      error={error}
      onClick={() => start(item, returnTo)}
    >
      {children}
    </CheckoutControl>
  );
}

/**
 * Souscription d'une formule ou essai de Pro (US-20, US-21) : la périodicité est celle choisie
 * avec la bascule Mensuel / Annuel qui englobe le bouton (mensuelle sinon).
 */
export function PlanCheckoutButton({
  tier,
  trial = false,
  children,
  ...buttonProps
}: ButtonProps & { tier: PlanTier; trial?: boolean; children: ReactNode }) {
  const { start, busy, error } = useCheckout();
  return (
    <CheckoutControl
      {...buttonProps}
      busy={busy}
      error={error}
      onClick={(button) => {
        const interval = (button
          .closest("[data-interval]")
          ?.getAttribute("data-interval") ?? "month") as BillingInterval;
        start({ kind: "subscription", tier, interval, trial });
      }}
    >
      {children}
    </CheckoutControl>
  );
}
