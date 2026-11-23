import { describe, expect, it } from "vitest";
import {
  annualSavingsPercent,
  cheapestPackPriceCents,
  featureValue,
  maxAnnualSavingsPercent,
  OPERATION_COSTS,
  PLAN_FEATURES,
  PLAN_TIERS,
  planPriceCents,
} from "@/features/plans/catalog";

describe("catalogue des offres", () => {
  it("reprend les prix et crédits du §12 de l'INTAKE", () => {
    expect(PLAN_TIERS.map((tier) => planPriceCents(tier, "month"))).toEqual([
      399, 699, 999,
    ]);
    expect(PLAN_TIERS.map((tier) => planPriceCents(tier, "year"))).toEqual([
      2999, 3999, 6999,
    ]);
  });

  it("calcule les économies annuelles réelles (ADR-002 : Pro −52 %, et non −43 %)", () => {
    expect(annualSavingsPercent("essential")).toBe(37);
    expect(annualSavingsPercent("pro")).toBe(52);
    expect(annualSavingsPercent("premium")).toBe(42);
    expect(maxAnnualSavingsPercent()).toBe(52);
  });

  it("réserve adaptation, mots-clés, lettre, entretien et historique illimité à Pro et Premium", () => {
    for (const feature of [
      "jobAdaptation",
      "missingKeywords",
      "coverLetter",
      "interview",
      "unlimitedHistory",
    ] as const) {
      expect(featureValue(feature, "essential"), feature).toBe(false);
      expect(featureValue(feature, "pro"), feature).toBe(true);
      expect(featureValue(feature, "premium"), feature).toBe(true);
    }
  });

  it("donne 3 variantes d'accroche à Essential et 5 à Pro et Premium", () => {
    expect(
      PLAN_TIERS.map((tier) => featureValue("summaryVariants", tier)),
    ).toEqual([3, 5, 5]);
  });

  it("définit une valeur pour chaque fonctionnalité de chaque formule", () => {
    for (const feature of PLAN_FEATURES) {
      for (const tier of PLAN_TIERS) {
        expect(featureValue(feature, tier), `${feature}/${tier}`).toBeDefined();
      }
    }
  });

  it("reprend les coûts en crédits du §11.1", () => {
    expect(OPERATION_COSTS).toEqual({
      generateCv: 1,
      improveExperience: 1,
      improveSummary: 1,
      adaptToJob: 2,
      coverLetter: 2,
      linkedin: 1,
      interview: 2,
    });
  });

  it("annonce le pack le moins cher à 2,99 €", () => {
    expect(cheapestPackPriceCents()).toBe(299);
  });
});
