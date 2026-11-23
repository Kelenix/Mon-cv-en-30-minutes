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
};

export const PLANS: Record<PlanTier, Plan> = {
  essential: {
    monthlyPriceCents: 399,
    yearlyPriceCents: 2999,
    monthlyCredits: 20,
    summaryVariants: 3,
    aiPriority: "standard",
  },
  pro: {
    monthlyPriceCents: 699,
    yearlyPriceCents: 3999,
    monthlyCredits: 60,
    summaryVariants: 5,
    aiPriority: "priority",
  },
  premium: {
    monthlyPriceCents: 999,
    yearlyPriceCents: 6999,
    monthlyCredits: 150,
    summaryVariants: 5,
    aiPriority: "max",
  },
};

export const RECOMMENDED_PLAN: PlanTier = "pro";

/** Variantes d'accroche sans abonnement (C5). */
export const FREE_SUMMARY_VARIANTS = 3;

export const TRIAL = { plan: "pro", days: 3, credits: 10 } as const;

export const CREDIT_PACKS = [
  { id: "credits_5", credits: 5, priceCents: 299 },
  { id: "credits_15", credits: 15, priceCents: 699 },
  { id: "credits_40", credits: 40, priceCents: 1499 },
] as const;

export const CV_PRO_PRICE_CENTS = 499;
export const ADS_REMOVAL_PRICE_CENTS = 299;

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
