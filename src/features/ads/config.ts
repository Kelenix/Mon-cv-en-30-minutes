// Réglages des annonces transmis aux composants : ces identifiants publics figurent de toute façon
// dans les pages qui affichent des annonces (aucun secret).

export type AdsConfig = {
  /**
   * simulation : annonces de test sans script externe ; adsense : bannière et native AdSense ;
   * google : Ad Manager, tous les formats (ADR-047).
   */
  mode: "simulation" | "adsense" | "google";
  /** Identifiant d'éditeur Google (pub-…), pour le bandeau de consentement et AdSense. */
  publisherId: string;
  /** Code réseau Ad Manager. */
  networkCode: string;
  /** Blocs d'annonces AdSense ; vides tant qu'ils ne sont pas créés (emplacement masqué). */
  slots: { banner: string; native: string };
};

/** Blocs d'annonces à créer dans Ad Manager (tâche manuelle 10). */
export const AD_UNITS = {
  banner: "mon-cv-banniere",
  native: "mon-cv-native",
  interstitial: "mon-cv-interstitiel",
  rewarded: "mon-cv-video-recompensee",
} as const;

/** Crédits gagnés au plus par jour avec les vidéos récompensées (US-35 c.3). */
export const DAILY_REWARDED_CREDITS = 3;

/** Durée de l'annonce de test du mode simulation, en secondes (au moins 5 : voir le serveur). */
export const SIMULATED_AD_SECONDS = 6;

/** Vidéo récompensée et interstitiel : formats d'Ad Manager, absents d'AdSense (ADR-047). */
export function hasAccountFormats(mode: AdsConfig["mode"] | "off") {
  return mode === "simulation" || mode === "google";
}

export function adUnitPath(config: AdsConfig, unit: keyof typeof AD_UNITS) {
  return `/${config.networkCode}/${AD_UNITS[unit]}`;
}
