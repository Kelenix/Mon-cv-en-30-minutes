import { describe, expect, it } from "vitest";
import { hasAccountFormats } from "@/features/ads/config";

// Formats liés au compte (vidéo récompensée US-35, interstitiel US-34) : Ad Manager seulement,
// absents d'AdSense (ADR-047) ; le mode simulation les garde pour les tests de bout en bout.
describe("hasAccountFormats", () => {
  it("les propose avec Ad Manager et en simulation", () => {
    expect(hasAccountFormats("google")).toBe(true);
    expect(hasAccountFormats("simulation")).toBe(true);
  });

  it("les retire avec AdSense et sans publicités", () => {
    expect(hasAccountFormats("adsense")).toBe(false);
    expect(hasAccountFormats("off")).toBe(false);
  });
});
