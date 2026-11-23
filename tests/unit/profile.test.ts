import { describe, expect, it } from "vitest";
import { validationError } from "@/core/action-result";
import { DELETE_CONFIRMATION_WORDS } from "@/features/profile/delete-confirmation";
import { namesFromMetadata } from "@/features/profile/names";
import {
  deleteAccountSchema,
  profileSchema,
  welcomeSchema,
} from "@/features/profile/schemas";
import fr from "../../messages/fr.json";

describe("saisie du profil", () => {
  it("nettoie les champs et enregistre les champs facultatifs vides comme absents", () => {
    const parsed = profileSchema.parse({
      firstName: "  Awa ",
      lastName: "Diallo",
      phone: " ",
      city: "",
    });
    expect(parsed).toEqual({
      firstName: "Awa",
      lastName: "Diallo",
      phone: null,
      city: null,
    });
  });

  it("renvoie une clé de traduction par champ en erreur", () => {
    const result = profileSchema.safeParse({
      firstName: "",
      lastName: "x".repeat(61),
      phone: "06 12 ab",
      city: "Lyon",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const response = validationError(result.error);
    expect(response).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        details: {
          firstName: "required",
          lastName: "tooLong",
          phone: "invalidPhone",
        },
      },
    });
    // Chaque clé renvoyée existe dans les traductions.
    for (const key of ["required", "tooLong", "invalidPhone"]) {
      expect(fr.errors.fields).toHaveProperty(key);
    }
  });

  it("accepte les formats de téléphone usuels", () => {
    for (const phone of [
      "+33 6 12 34 56 78",
      "(030) 1234-5678",
      "06.12.34.56.78",
    ]) {
      expect(
        profileSchema.safeParse({
          firstName: "A",
          lastName: "B",
          phone,
          city: "",
        }).success,
      ).toBe(true);
    }
  });

  it("exige une langue proposée à la première connexion", () => {
    expect(
      welcomeSchema.safeParse({ locale: "pt", firstName: "A", lastName: "B" })
        .success,
    ).toBe(false);
  });
});

describe("confirmation de suppression du compte", () => {
  it("attend le mot de la langue de l'interface, sans tenir compte de la casse", () => {
    expect(
      deleteAccountSchema.safeParse({
        locale: "fr",
        confirmation: " supprimer ",
      }).success,
    ).toBe(true);
    expect(
      deleteAccountSchema.safeParse({ locale: "de", confirmation: "löschen" })
        .success,
    ).toBe(true);
    expect(
      deleteAccountSchema.safeParse({ locale: "en", confirmation: "SUPPRIMER" })
        .success,
    ).toBe(false);
  });

  it("définit un mot pour chacune des 5 langues", () => {
    expect(Object.keys(DELETE_CONFIRMATION_WORDS).sort()).toEqual([
      "de",
      "en",
      "es",
      "fr",
      "it",
    ]);
  });
});

describe("noms proposés à la première connexion", () => {
  it("reprend le prénom et le nom fournis par Google", () => {
    expect(
      namesFromMetadata({ given_name: "Léa", family_name: "Martin" }),
    ).toEqual({
      firstName: "Léa",
      lastName: "Martin",
    });
  });

  it("découpe le nom complet à défaut", () => {
    expect(namesFromMetadata({ full_name: "Jean Paul Sartre" })).toEqual({
      firstName: "Jean",
      lastName: "Paul Sartre",
    });
  });

  it("laisse les champs vides sans métadonnées (connexion par e-mail)", () => {
    expect(namesFromMetadata({ locale: "fr" })).toEqual({
      firstName: "",
      lastName: "",
    });
  });
});
