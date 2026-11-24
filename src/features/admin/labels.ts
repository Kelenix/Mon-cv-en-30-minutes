// Libellés français des valeurs techniques affichées dans l'administration.

const LABELS: Record<string, Record<string, string>> = {
  plan: { essential: "Essential", pro: "Pro", premium: "Premium" },
  interval: { month: "mensuel", year: "annuel" },
  status: {
    trialing: "Essai",
    active: "Actif",
    past_due: "Paiement en retard",
    unpaid: "Impayé",
    canceled: "Résilié",
    incomplete: "Incomplet",
    incomplete_expired: "Expiré",
    paused: "En pause",
  },
  item: {
    credits_5: "Pack 5 crédits",
    credits_15: "Pack 15 crédits",
    credits_40: "Pack 40 crédits",
    cv_pro: "CV Pro",
    ads_removal: "Retrait des publicités",
    abonnement_essential: "Abonnement Essential",
    abonnement_pro: "Abonnement Pro",
    abonnement_premium: "Abonnement Premium",
    abonnement_inconnu: "Abonnement",
  },
  method: {
    card: "Carte bancaire",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    link: "Link (Stripe)",
    samsung_pay: "Samsung Pay",
    paypal: "PayPal",
    sepa_debit: "Prélèvement SEPA",
    bancontact: "Bancontact",
    ideal: "iDEAL",
    klarna: "Klarna",
    revolut_pay: "Revolut Pay",
    inconnu: "Non renseigné",
  },
  aiKind: {
    generate_cv: "Création de CV",
    improve_experience: "Amélioration d'expérience",
    improve_summary: "Accroche",
    adapt_to_job: "Adaptation à une offre",
    linkedin: "Version LinkedIn",
    cover_letter: "Lettre de motivation",
    interview: "Simulation d'entretien",
    interview_feedback: "Retour d'entretien",
  },
  generation: {
    improve_experience: "Amélioration d'expérience",
    improve_summary: "Accroche",
    adapt_to_job: "Adaptation à une offre",
    linkedin: "Version LinkedIn",
    cover_letter: "Lettre de motivation",
    interview: "Simulation d'entretien",
  },
  reason: {
    ai_operation: "Opérations IA",
    ai_refund: "Remboursements IA",
    pack_purchase: "Packs achetés",
    rewarded_ad: "Vidéos récompensées",
    trial_grant: "Essais",
    monthly_grant: "Remises mensuelles",
    upgrade_grant: "Montées de formule",
    included_expiry: "Crédits inclus expirés",
    subscription_end: "Fins d'abonnement",
    admin_grant: "Offerts par l'administration",
  },
  channel: {
    direct: "Accès direct",
    search: "Moteurs de recherche",
    social: "Réseaux sociaux",
    referral: "Sites référents",
    campaign: "Campagnes (utm)",
  },
  source: {
    direct: "Accès direct",
    google: "Google",
    bing: "Bing",
    duckduckgo: "DuckDuckGo",
    qwant: "Qwant",
    ecosia: "Ecosia",
    yahoo: "Yahoo",
    brave: "Brave",
    yandex: "Yandex",
    startpage: "Startpage",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    x: "X (Twitter)",
    tiktok: "TikTok",
    youtube: "YouTube",
    pinterest: "Pinterest",
    reddit: "Reddit",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    snapchat: "Snapchat",
    threads: "Threads",
  },
  locale: {
    fr: "Français",
    en: "Anglais",
    it: "Italien",
    es: "Espagnol",
    de: "Allemand",
  },
  action: {
    grant_credits: "Crédits offerts",
    ban: "Compte suspendu",
    unban: "Compte réactivé",
    delete: "Compte supprimé",
  },
  aiError: {
    STALE: "Opération abandonnée",
    inconnue: "Inconnue",
  },
};

export type LabelGroup = keyof typeof LABELS;

/** Libellé d'une valeur, ou la valeur elle-même si elle n'est pas connue. */
export function label(group: LabelGroup, value: string | null | undefined) {
  if (!value) return "–";
  return LABELS[group]?.[value] ?? value;
}

const regions = new Intl.DisplayNames(["fr"], { type: "region" });

/** Nom du pays (« France ») ; `ZZ` et les valeurs absentes sont « Inconnu ». */
export function countryName(code: string | null | undefined) {
  if (!code || code === "ZZ" || code === "inconnu") return "Inconnu";
  try {
    return regions.of(code) ?? code;
  } catch {
    return code;
  }
}
