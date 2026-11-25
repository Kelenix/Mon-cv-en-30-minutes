import { describe, expect, it } from "vitest";
import {
  COUNTRY_CODES,
  defaultCountry,
  initialTemplate,
  orderedTemplates,
  recommendedTemplates,
} from "@/features/cv/countries";
import {
  CV_TEMPLATES,
  canDownloadTemplate,
  TEMPLATE_INFO,
  toTemplate,
} from "@/features/cv/templates";

// Modèles de CV par pays (Inc-15, ADR-050).
describe("modèles", () => {
  it("deux modèles gratuits, ATS classique et format européen", () => {
    expect(CV_TEMPLATES.filter((id) => TEMPLATE_INFO[id].free)).toEqual([
      "ats-classique",
      "europeen",
    ]);
  });

  it("un modèle payant se télécharge seulement avec les droits d'export", () => {
    expect(canDownloadTemplate("moderne", false)).toBe(false);
    expect(canDownloadTemplate("moderne", true)).toBe(true);
    expect(canDownloadTemplate("europeen", false)).toBe(true);
  });

  it("un modèle inconnu redevient le modèle par défaut", () => {
    expect(toTemplate("inconnu")).toBe("ats-classique");
    expect(toTemplate("lebenslauf")).toBe("lebenslauf");
  });
});

describe("pays visés", () => {
  it("chaque pays recommande des modèles existants", () => {
    for (const country of COUNTRY_CODES) {
      const recommended = recommendedTemplates(country);
      expect(recommended.length).toBeGreaterThan(0);
      for (const template of recommended) {
        expect(CV_TEMPLATES).toContain(template);
      }
    }
  });

  it("la galerie montre les recommandés d'abord, sans oubli ni doublon", () => {
    const order = orderedTemplates("DE");
    expect(order[0]).toBe("lebenslauf");
    expect([...order].sort()).toEqual([...CV_TEMPLATES].sort());
  });

  it("pays des langues du navigateur, sinon de la langue du site", () => {
    expect(defaultCountry("fr", ["fr-BE", "fr"])).toBe("BE");
    expect(defaultCountry("en", ["en-US"])).toBe("US");
    expect(defaultCountry("de", ["de"])).toBe("DE");
    expect(defaultCountry("en", ["en-XX"])).toBe("GB");
  });

  it("un nouveau CV reçoit le premier modèle recommandé qu'il peut télécharger", () => {
    // Allemagne : Lebenslauf avec une formule, format européen (gratuit) sans.
    expect(initialTemplate("DE", true)).toBe("lebenslauf");
    expect(initialTemplate("DE", false)).toBe("europeen");
    // États-Unis : ATS classique dans les deux cas, photo déconseillée.
    expect(initialTemplate("US", false)).toBe("ats-classique");
    // France sans formule : aucun recommandé gratuit, modèle ATS classique.
    expect(initialTemplate("FR", false)).toBe("ats-classique");
  });
});
