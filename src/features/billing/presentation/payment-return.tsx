"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

const POLL_MS = 1_500;
const MAX_WAIT_MS = 10_000;

type Status = "pending" | "confirmed" | "slow";

/**
 * Retour de Stripe Checkout (US-18 c.3 et c.4, docs/design/flows.md §3.7) : le solde est
 * interrogé toutes les 1,5 s pendant 10 s au plus, jusqu'à la confirmation de l'achat par le
 * webhook ; la page est alors relue. `children` (suite du parcours) n'apparaît qu'une fois
 * l'achat confirmé ou l'attente écoulée.
 */
export function PaymentReturn({
  outcome,
  sessionId,
  subscription,
  children,
}: {
  outcome: "ok" | "annule";
  sessionId?: string;
  /** Retour d'une souscription : confirmé quand la formule est active. */
  subscription: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations("billing.return");
  const router = useRouter();
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (outcome !== "ok") return;
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let active = true;

    async function poll() {
      const query = sessionId
        ? `?session_id=${encodeURIComponent(sessionId)}`
        : "";
      const response = await fetch(`/api/me/wallet${query}`, {
        cache: "no-store",
      }).catch(() => null);
      const wallet = response?.ok
        ? ((await response.json()) as {
            purchaseConfirmed: boolean;
            plan: string | null;
          })
        : null;
      if (!active) return;
      if (wallet && (subscription ? wallet.plan : wallet.purchaseConfirmed)) {
        setStatus("confirmed");
        router.refresh();
      } else if (Date.now() - startedAt >= MAX_WAIT_MS) {
        setStatus("slow");
      } else {
        timer = setTimeout(poll, POLL_MS);
      }
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [outcome, sessionId, subscription, router]);

  if (outcome === "annule") {
    return (
      <>
        <FormAlert tone="success" message={t("cancelled")} />
        {children}
      </>
    );
  }
  if (status === "pending") {
    return (
      <p role="status" className="rounded-lg bg-surface px-4 py-3 font-medium">
        {t("pending")}
      </p>
    );
  }
  return (
    <>
      {status === "confirmed" ? (
        <FormAlert tone="success" message={t("done")} />
      ) : (
        <div className="grid justify-items-start gap-3 rounded-lg bg-surface px-4 py-3">
          <p role="status" className="font-medium">
            {t("slow")}
          </p>
          <Button variant="outline" onClick={() => router.refresh()}>
            <RefreshCwIcon aria-hidden="true" />
            {t("refresh")}
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
