// Source unique des offres, prix et coûts (INTAKE §11, §12 ; matrice des droits :
// docs/product/user-stories.md §3). Prix TTC en centimes d'euro, identiques dans toutes les langues.

export const PLAN_TIERS = ["essential", "pro", "premium"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export type AiPriority = "standard" | "priority" | "max";

type Plan = {
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyCredits: number;
  summaryVariants: number;
  aiPriority: AiPriority;
  /** Opérations IA par minute (docs/system-design.md §10). */
  aiOperationsPerMinute: number;
};

export const PLANS: Record<PlanTier, Plan> = {
  essential: {
    monthlyPriceCents: 399,
    yearlyPriceCents: 2999,
    monthlyCredits: 20,
    summaryVariants: 3,
    aiPriority: "standard",
    aiOperationsPerMinute: 5,
  },
  pro: {
    monthlyPriceCents: 699,
    yearlyPriceCents: 3999,
    monthlyCredits: 60,
    summaryVariants: 5,
    aiPriority: "priority",
    aiOperationsPerMinute: 10,
  },
  premium: {
    monthlyPriceCents: 999,
    yearlyPriceCents: 6999,
    monthlyCredits: 150,
    summaryVariants: 5,
    aiPriority: "max",
    aiOperationsPerMinute: 20,
  },
};

export const RECOMMENDED_PLAN: PlanTier = "pro";

/** Variantes d'accroche sans abonnement (C5). */
export const FREE_SUMMARY_VARIANTS = 3;

/** Opérations IA par minute sans abonnement (docs/system-design.md §10). */
export const FREE_AI_OPERATIONS_PER_MINUTE = 3;

/** Plafond de générations gratuites par adresse IP et par jour (H27). */
export const FREE_GENERATIONS_PER_IP_PER_DAY = 3;

export const TRIAL = { plan: "pro", days: 3, credits: 10 } as const;

export const CREDIT_PACKS = [
  { id: "credits_5", credits: 5, priceCents: 299 },
  { id: "credits_15", credits: 15, priceCents: 699 },
  { id: "credits_40", credits: 40, priceCents: 1499 },
] as const;

export const CV_PRO_PRICE_CENTS = 499;
export const ADS_REMOVAL_PRICE_CENTS = 299;

/** Produits vendus à l'unité ; leur identifiant, préfixé, est la clé du prix Stripe. */
export const PURCHASE_PRODUCTS = [
  "credits_5",
  "credits_15",
  "credits_40",
  "cv_pro",
  "ads_removal",
] as const;
export type PurchaseProduct = (typeof PURCHASE_PRODUCTS)[number];
export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function purchasePriceCents(product: PurchaseProduct): number {
  if (product === "cv_pro") return CV_PRO_PRICE_CENTS;
  if (product === "ads_removal") return ADS_REMOVAL_PRICE_CENTS;
  return CREDIT_PACKS.find((pack) => pack.id === product)!.priceCents;
}

/** Crédits ajoutés par un produit (0 pour CV Pro et la suppression des publicités). */
export function productCredits(product: PurchaseProduct): number {
  return CREDIT_PACKS.find((pack) => pack.id === product)?.credits ?? 0;
}

/** Clé d'une formule dans l'application (« pro_month », « premium_year »…). */
export function subscriptionLookupKey(
  tier: PlanTier,
  interval: BillingInterval,
) {
  return `${tier}_${interval}`;
}

/**
 * Marque des objets Stripe de l'application : le compte Stripe sert aussi à d'autres produits
 * (ADR-042). Préfixe les clés de prix et repère produits, portail et sessions de paiement.
 */
export const STRIPE_APP = "moncv";

/** Clé du prix chez Stripe (« moncv_credits_15 », « moncv_pro_month »…). */
export function stripeLookupKey(key: string) {
  return `${STRIPE_APP}_${key}`;
}

/** Formule d'un prix Stripe ; `null` pour un pack ou le prix d'un autre produit du compte. */
export function parseSubscriptionLookupKey(
  key: string | null | undefined,
): { tier: PlanTier; interval: BillingInterval } | null {
  const [app, tier, interval, ...rest] = (key ?? "").split("_");
  return app === STRIPE_APP &&
    rest.length === 0 &&
    PLAN_TIERS.includes(tier as PlanTier) &&
    BILLING_INTERVALS.includes(interval as BillingInterval)
    ? { tier: tier as PlanTier, interval: interval as BillingInterval }
    : null;
}

/** Coût en crédits de chaque opération IA (§11.1). */
export const OPERATION_COSTS = {
  generateCv: 1,
  improveExperience: 1,
  improveSummary: 1,
  adaptToJob: 2,
  coverLetter: 2,
  linkedin: 1,
  interview: 2,
} as const;

export type OperationKey = keyof typeof OPERATION_COSTS;

/** Valeur d'une fonctionnalité pour une formule : incluse, exclue, ou une quantité / un niveau. */
export type FeatureValue = boolean | number | AiPriority;

export const PLAN_FEATURES = [
  "cvCreation",
  "exportsWithoutWatermark",
  "linkedin",
  "summaryVariants",
  "jobAdaptation",
  "missingKeywords",
  "coverLetter",
  "interview",
  "unlimitedHistory",
  "aiPriority",
  "noAds",
] as const;

export type PlanFeature = (typeof PLAN_FEATURES)[number];

const PRO_ONLY: Record<PlanTier, boolean> = {
  essential: false,
  pro: true,
  premium: true,
};
const ALL_PLANS: Record<PlanTier, boolean> = {
  essential: true,
  pro: true,
  premium: true,
};

/** Tableau du §12 de l'INTAKE, formule par formule. */
export function featureValue(
  feature: PlanFeature,
  tier: PlanTier,
): FeatureValue {
  switch (feature) {
    case "summaryVariants":
      return PLANS[tier].summaryVariants;
    case "aiPriority":
      return PLANS[tier].aiPriority;
    case "jobAdaptation":
    case "missingKeywords":
    case "coverLetter":
    case "interview":
    case "unlimitedHistory":
      return PRO_ONLY[tier];
    case "cvCreation":
    case "exportsWithoutWatermark":
    case "linkedin":
    case "noAds":
      return ALL_PLANS[tier];
  }
}

export function planPriceCents(
  tier: PlanTier,
  interval: BillingInterval,
): number {
  const plan = PLANS[tier];
  return interval === "month" ? plan.monthlyPriceCents : plan.yearlyPriceCents;
}

/** Économie de l'abonnement annuel par rapport à 12 mois, arrondie au pourcent (ADR-002). */
export function annualSavingsPercent(tier: PlanTier): number {
  const plan = PLANS[tier];
  return Math.round(
    (1 - plan.yearlyPriceCents / (plan.monthlyPriceCents * 12)) * 100,
  );
}

export function maxAnnualSavingsPercent(): number {
  return Math.max(...PLAN_TIERS.map(annualSavingsPercent));
}

/** Prix du pack le moins cher, pour l'accroche « à partir de ». */
export function cheapestPackPriceCents(): number {
  return Math.min(...CREDIT_PACKS.map((pack) => pack.priceCents));
}

export function centsToEuros(cents: number): number {
  return cents / 100;
}
