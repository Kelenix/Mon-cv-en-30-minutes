import { describe, expect, it } from "vitest";
import { OPERATION_COSTS, type OperationKey } from "@/features/plans/catalog";
import {
  type ActivePlan,
  canUseIncludedCredits,
  planCharge,
  planEntitlements,
} from "@/features/plans/entitlements";

// Matrice des droits (docs/product/user-stories.md §3), opération par opération.

const OPERATIONS = Object.keys(OPERATION_COSTS) as OperationKey[];
const PURCHASED_ONLY_FOR_ESSENTIAL: OperationKey[] = [
  "adaptToJob",
  "coverLetter",
  "interview",
];

describe("crédits inclus utilisables", () => {
  it.each(OPERATIONS)("%s : jamais sans abonnement", (operation) => {
    expect(canUseIncludedCredits(null, operation)).toBe(false);
  });

  it.each(OPERATIONS)("%s : toujours avec Pro et Premium", (operation) => {
    expect(canUseIncludedCredits("pro", operation)).toBe(true);
    expect(canUseIncludedCredits("premium", operation)).toBe(true);
  });

  it.each(OPERATIONS)(
    "%s : avec Essential, sauf adaptation, lettre et entretien (Q2)",
    (operation) => {
      expect(canUseIncludedCredits("essential", operation)).toBe(
        !PURCHASED_ONLY_FOR_ESSENTIAL.includes(operation),
      );
    },
  );
});

describe("coût d'une opération (US-08)", () => {
  it("rend gratuite la première génération de CV, une seule fois par compte", () => {
    const balances = { included: 0, purchased: 0 };
    expect(
      planCharge({
        plan: null,
        operation: "generateCv",
        balances,
        freeGenerationAvailable: true,
      }),
    ).toEqual({ allowed: true, cost: 0, free: true, allowIncluded: false });
    expect(
      planCharge({ plan: null, operation: "generateCv", balances }),
    ).toMatchObject({ allowed: false, missing: 1 });
  });

  it("applique les coûts du §11.1", () => {
    const balances = { included: 0, purchased: 100 };
    for (const operation of OPERATIONS) {
      expect(planCharge({ plan: null, operation, balances })).toMatchObject({
        allowed: true,
        cost: OPERATION_COSTS[operation],
      });
    }
  });

  it("refuse une lettre à un abonné Essential sans crédits achetés (US-09 c.2)", () => {
    expect(
      planCharge({
        plan: "essential",
        operation: "coverLetter",
        balances: { included: 20, purchased: 0 },
      }),
    ).toEqual({
      allowed: false,
      reason: "INSUFFICIENT_CREDITS",
      cost: 2,
      allowIncluded: false,
      missing: 2,
    });
  });

  it("accepte une lettre sans abonnement avec 2 crédits achetés (US-09 c.3)", () => {
    expect(
      planCharge({
        plan: null,
        operation: "coverLetter",
        balances: { included: 0, purchased: 2 },
      }),
    ).toEqual({ allowed: true, cost: 2, free: false, allowIncluded: false });
  });

  it("additionne crédits inclus et achetés quand la formule le permet", () => {
    const plans: ActivePlan[] = ["pro", "premium"];
    for (const plan of plans) {
      expect(
        planCharge({
          plan,
          operation: "interview",
          balances: { included: 1, purchased: 1 },
        }),
      ).toMatchObject({ allowed: true, allowIncluded: true });
    }
  });
});

describe("droits hors IA (matrice §3)", () => {
  it("sans abonnement : 1 CV, filigrane, publicités, 3 variantes", () => {
    expect(planEntitlements(null)).toEqual({
      summaryVariants: 3,
      cvLimit: 1,
      exportsWithoutWatermark: false,
      ads: true,
      aiPriority: "standard",
      aiOperationsPerMinute: 3,
    });
  });

  it("Essential : 1 CV, sans filigrane ni publicité, 3 variantes", () => {
    expect(planEntitlements("essential")).toMatchObject({
      summaryVariants: 3,
      cvLimit: 1,
      exportsWithoutWatermark: true,
      ads: false,
      aiOperationsPerMinute: 5,
    });
  });

  it("Pro et Premium : historique illimité, 5 variantes, priorité", () => {
    expect(planEntitlements("pro")).toMatchObject({
      cvLimit: null,
      summaryVariants: 5,
      aiPriority: "priority",
      aiOperationsPerMinute: 10,
    });
    expect(planEntitlements("premium")).toMatchObject({
      cvLimit: null,
      summaryVariants: 5,
      aiPriority: "max",
      aiOperationsPerMinute: 20,
    });
  });
});
