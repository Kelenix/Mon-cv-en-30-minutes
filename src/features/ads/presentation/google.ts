/// <reference types="google-publisher-tag" />

// Scripts Google, chargés à la demande et une seule fois, seulement sur les pages qui affichent une
// annonce (docs/architecture.md §11) : d'abord le bandeau de consentement certifié
// (« Confidentialité et messages », TCF), puis la bibliothèque d'annonces (Ad Manager : GPT ;
// AdSense : adsbygoogle, ADR-047), qui attend la réponse du bandeau avant toute requête.

declare global {
  interface Window {
    googlefc?: {
      callbackQueue: (() => void)[];
      showRevocationMessage?: () => void;
    };
    adsbygoogle?: object[];
  }
}

function addScript(src: string, crossOrigin?: "anonymous") {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    if (crossOrigin) script.crossOrigin = crossOrigin;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(src));
    document.head.append(script);
  });
}

/** Signal attendu par le bandeau de Google (extrait fourni par Google, sans code exécuté). */
function signalConsentPresent() {
  if (document.querySelector('iframe[name="googlefcPresent"]')) return;
  const frame = document.createElement("iframe");
  frame.name = "googlefcPresent";
  frame.title = "googlefcPresent";
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  frame.style.display = "none";
  document.body.append(frame);
}

let consent: Promise<void> | undefined;
let gpt: Promise<void> | undefined;
let adsense: Promise<void> | undefined;

export function loadConsent(publisherId: string) {
  consent ??= (async () => {
    window.googlefc ??= { callbackQueue: [] };
    signalConsentPresent();
    await addScript(
      `https://fundingchoicesmessages.google.com/i/${publisherId}?ers=1`,
    );
  })();
  return consent;
}

/** Bandeau de consentement, puis GPT ; un bloqueur de publicités fait échouer la promesse. */
export function loadGoogleAds(publisherId: string) {
  gpt ??= (async () => {
    await loadConsent(publisherId);
    window.googletag ??= { cmd: [] } as unknown as typeof googletag;
    await addScript("https://securepubads.g.doubleclick.net/tag/js/gpt.js");
    googletag.cmd.push(() => {
      googletag.enableServices();
    });
  })();
  return gpt;
}

/**
 * Bandeau de consentement, puis AdSense ; le bandeau signale sa présence, donc AdSense n'en
 * charge pas un second.
 */
export function loadAdSense(publisherId: string) {
  adsense ??= (async () => {
    await loadConsent(publisherId);
    await addScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${publisherId}`,
      "anonymous",
    );
  })();
  return adsense;
}

/** « Gérer les cookies » : rouvre le choix dans le bandeau de Google (US-32 c.3). */
export async function showGoogleConsentChoices(publisherId: string) {
  await loadConsent(publisherId);
  window.googlefc?.callbackQueue.push(() =>
    window.googlefc?.showRevocationMessage?.(),
  );
}
