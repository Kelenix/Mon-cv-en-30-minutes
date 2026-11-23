import {
  type AiPriority,
  FREE_AI_OPERATIONS_PER_MINUTE,
  FREE_SUMMARY_VARIANTS,
  OPERATION_COSTS,
  type OperationKey,
  PLANS,
  type PlanTier,
} from "./catalog";

// Moteur de droits : matrice de docs/product/user-stories.md §3 (Q2, ADR-006). Logique pure,
// appliquée côté serveur avant toute opération (US-09) et utilisée par l'interface pour
// afficher coûts et cadenas.

/** Formule en cours : `null` sans abonnement ; l'essai de 3 jours compte comme Pro. */
export type ActivePlan = PlanTier | null;

export type Balances = { included: number; purchased: number };

/** Fonctions que les crédits inclus d'Essential ne paient pas : crédits achetés uniquement. */
const PURCHASED_ONLY_FOR_ESSENTIAL: ReadonlySet<OperationKey> = new Set([
  "adaptToJob",
  "coverLetter",
  "interview",
]);

/** Les crédits inclus de la formule peuvent-ils payer cette opération ? */
export function canUseIncludedCredits(
  plan: ActivePlan,
  operation: OperationKey,
): boolean {
  if (plan === null) return false;
  return plan !== "essential" || !PURCHASED_ONLY_FOR_ESSENTIAL.has(operation);
}

export type Charge =
  | { allowed: true; cost: number; free: boolean; allowIncluded: boolean }
  | {
      allowed: false;
      reason: "INSUFFICIENT_CREDITS";
      cost: number;
      allowIncluded: boolean;
      missing: number;
    };

/**
 * Ce que coûte une opération et si le solde la couvre. La première génération de CV de chaque
 * compte est gratuite (H3) ; sinon le coût du §11.1 se paie en crédits inclus (si la matrice
 * le permet) puis en crédits achetés.
 */
export function planCharge({
  plan,
  operation,
  balances,
  freeGenerationAvailable = false,
}: {
  plan: ActivePlan;
  operation: OperationKey;
  balances: Balances;
  freeGenerationAvailable?: boolean;
}): Charge {
  if (operation === "generateCv" && freeGenerationAvailable) {
    return { allowed: true, cost: 0, free: true, allowIncluded: false };
  }
  const cost = OPERATION_COSTS[operation];
  const allowIncluded = canUseIncludedCredits(plan, operation);
  const available =
    balances.purchased + (allowIncluded ? balances.included : 0);

  return available >= cost
    ? { allowed: true, cost, free: false, allowIncluded }
    : {
        allowed: false,
        reason: "INSUFFICIENT_CREDITS",
        cost,
        allowIncluded,
        missing: cost - available,
      };
}

export type Entitlements = {
  /** Variantes proposées pour l'accroche. */
  summaryVariants: number;
  /** Nombre de CV conservés (`null` : illimité). */
  cvLimit: number | null;
  /** Export PDF sans filigrane et DOCX (sinon : CV Pro acheté pour ce CV). */
  exportsWithoutWatermark: boolean;
  /** Publicités affichées (sauf retrait acheté, Inc-11). */
  ads: boolean;
  aiPriority: AiPriority;
  /** Limite de débit des opérations IA. */
  aiOperationsPerMinute: number;
};

/** PDF sans filigrane et DOCX (US-17) : abonnés (essai compris) ou CV débloqué en CV Pro. */
export function canExportWithoutWatermark(
  plan: ActivePlan,
  cvProUnlocked: boolean,
) {
  return planEntitlements(plan).exportsWithoutWatermark || cvProUnlocked;
}

/** Droits hors opérations IA, selon la formule (matrice §3). */
export function planEntitlements(plan: ActivePlan): Entitlements {
  if (plan === null) {
    return {
      summaryVariants: FREE_SUMMARY_VARIANTS,
      cvLimit: 1,
      exportsWithoutWatermark: false,
      ads: true,
      aiPriority: "standard",
      aiOperationsPerMinute: FREE_AI_OPERATIONS_PER_MINUTE,
    };
  }
  return {
    summaryVariants: PLANS[plan].summaryVariants,
    cvLimit: plan === "essential" ? 1 : null,
    exportsWithoutWatermark: true,
    ads: false,
    aiPriority: PLANS[plan].aiPriority,
    aiOperationsPerMinute: PLANS[plan].aiOperationsPerMinute,
  };
}
