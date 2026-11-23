import { describe, expect, it } from "vitest";
import {
  isPrivatePath,
  isSignInPath,
  localeOfPath,
  localizedPath,
  safeNextPath,
  withNext,
} from "@/features/auth/paths";

describe("adresses localisées", () => {
  it("traduit les chemins internes dans chaque langue", () => {
    expect(localizedPath("fr", "/compte")).toBe("/fr/compte");
    expect(localizedPath("en", "/compte")).toBe("/en/account");
    expect(localizedPath("de", "/connexion")).toBe("/de/anmelden");
    expect(localizedPath("es", "/bienvenue")).toBe("/es/bienvenida");
    expect(localizedPath("it", "/")).toBe("/it");
  });

  it("lit la langue dans le premier segment", () => {
    expect(localeOfPath("/it/account")).toBe("it");
    expect(localeOfPath("/pt/conta")).toBeUndefined();
    expect(localeOfPath("/")).toBeUndefined();
  });

  it("ajoute la page à ouvrir après connexion", () => {
    expect(withNext("/fr/connexion", "/fr/compte?onglet=1")).toBe(
      "/fr/connexion?next=%2Ffr%2Fcompte%3Fonglet%3D1",
    );
  });
});

describe("pages privées", () => {
  it("reconnaît l'espace compte et l'étape de bienvenue dans toutes les langues", () => {
    for (const path of [
      "/fr/compte",
      "/en/account",
      "/it/account",
      "/es/cuenta",
      "/de/konto",
      "/de/konto/credits",
      "/en/welcome",
    ]) {
      expect(isPrivatePath(path), path).toBe(true);
    }
  });

  it("laisse publiques les autres pages, même au nom proche", () => {
    for (const path of ["/fr", "/fr/tarifs", "/fr/comptes", "/en/accounting"]) {
      expect(isPrivatePath(path), path).toBe(false);
    }
  });

  it("reconnaît la page de connexion", () => {
    expect(isSignInPath("/es/iniciar-sesion")).toBe(true);
    expect(isSignInPath("/fr/compte")).toBe(false);
  });
});

describe("destination après connexion (pas de redirection ouverte)", () => {
  it("accepte une adresse interne, requête comprise", () => {
    expect(safeNextPath("/fr/compte")).toBe("/fr/compte");
    expect(safeNextPath("/en/create?step=2")).toBe("/en/create?step=2");
  });

  it.each([
    "https://exemple.test/vol",
    "//exemple.test/vol",
    "/\\exemple.test",
    "javascript:alert(1)",
    "compte",
    "",
    "/" + "a".repeat(600),
  ])("refuse %s", (value) => {
    expect(safeNextPath(value)).toBeUndefined();
  });

  it("refuse une valeur qui n'est pas du texte", () => {
    expect(safeNextPath(null)).toBeUndefined();
    expect(safeNextPath(["/fr/compte"])).toBeUndefined();
  });
});
