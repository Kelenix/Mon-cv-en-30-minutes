"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

// Cloudflare Turnstile (ADR-039) : vérification anti-robot, invisible sauf si Cloudflare demande
// une interaction. Le formulaire reste utilisable : à l'envoi, il attend le jeton si besoin.

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: Record<string, unknown>,
  ) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// Au-delà, l'envoi part sans jeton et le serveur répond par un message clair.
const TOKEN_WAIT_MS = 10_000;
let scriptLoading: Promise<void> | undefined;

function loadScript() {
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = undefined;
      reject(new Error("Turnstile indisponible"));
    };
    document.head.append(script);
  });
  return scriptLoading;
}

/**
 * Vérification anti-robot d'un formulaire. `widget` s'affiche dans le formulaire (sans hauteur
 * tant qu'il est invisible) ; `withToken` ajoute le jeton aux données envoyées, en l'attendant
 * si Cloudflare n'a pas encore fini ; un nouveau `resetKey` (réponse du serveur) en demande un
 * nouveau, chaque jeton ne servant qu'une fois. Sans clé de site, rien n'est ajouté.
 */
export function useTurnstile(siteKey: string | null, resetKey: unknown) {
  const token = useRef<string | null>(null);
  const waiting = useRef<((value: string | null) => void)[]>([]);
  const [failed, setFailed] = useState(false);

  const onToken = useCallback((value: string | null) => {
    token.current = value;
    if (!value) return;
    setFailed(false);
    for (const resolve of waiting.current.splice(0)) resolve(value);
  }, []);

  const onFailed = useCallback(() => setFailed(true), []);

  const withToken = useCallback(
    async (formData: FormData) => {
      if (!siteKey) return formData;
      const value =
        token.current ??
        (await new Promise<string | null>((resolve) => {
          waiting.current.push(resolve);
          setTimeout(() => resolve(null), TOKEN_WAIT_MS);
        }));
      if (value) formData.set("cf-turnstile-response", value);
      return formData;
    },
    [siteKey],
  );

  const widget = siteKey ? (
    <TurnstileWidget
      siteKey={siteKey}
      resetKey={resetKey}
      onToken={onToken}
      onFailed={onFailed}
    />
  ) : null;
  return { widget, withToken, failed };
}

function TurnstileWidget({
  siteKey,
  resetKey,
  onToken,
  onFailed,
}: {
  siteKey: string;
  resetKey: unknown;
  onToken: (value: string | null) => void;
  onFailed: () => void;
}) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    let active = true;
    loadScript().then(
      () => {
        if (!active || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          language: locale,
          appearance: "interaction-only",
          size: "flexible",
          callback: (value: string) => onToken(value),
          "expired-callback": () => onToken(null),
          "error-callback": () => onFailed(),
          "before-interactive-callback": () => setInteractive(true),
          "after-interactive-callback": () => setInteractive(false),
        });
      },
      () => onFailed(),
    );
    return () => {
      active = false;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey, locale, onToken, onFailed]);

  useEffect(() => {
    if (!resetKey || !widgetId.current) return;
    onToken(null);
    window.turnstile?.reset(widgetId.current);
  }, [resetKey, onToken]);

  return <div ref={container} className={interactive ? "py-2" : undefined} />;
}
