import { describe, expect, it } from "vitest";
import { retentionWarningEmail } from "@/features/retention/warning-email";
import { routing } from "@/i18n/routing";

// E-mail d'avertissement avant suppression d'un compte inactif (Inc-13, US-40 c.1).

const deletionDate = new Date("2029-12-24T10:00:00Z");
const signInUrl = "https://exemple.test/fr/connexion";

describe("e-mail d'avertissement de suppression", () => {
  it.each(routing.locales)(
    "est rédigé en %s, avec la date et le lien",
    (locale) => {
      const email = retentionWarningEmail({
        locale,
        firstName: "Ada",
        deletionDate,
        signInUrl,
      });
      expect(email.subject).toMatch(/2029/);
      expect(email.html).toContain(`lang="${locale}"`);
      expect(email.html).toContain(`href="${signInUrl}"`);
      expect(email.text).toContain(signInUrl);
      expect(email.text).toMatch(/Ada/);
      expect(email.html).not.toMatch(/\{\w+\}/);
    },
  );

  it("date la suppression dans la langue du compte", () => {
    const fr = retentionWarningEmail({
      locale: "fr",
      firstName: null,
      deletionDate,
      signInUrl,
    });
    expect(fr.subject).toBe(
      "Ton compte Mon CV en 30 Secondes sera supprimé le 24 décembre 2029",
    );
    expect(fr.text.startsWith("Bonjour,\n")).toBe(true);
  });

  it("n'interprète pas le prénom comme du HTML", () => {
    const email = retentionWarningEmail({
      locale: "en",
      firstName: '<img src=x onerror="alert(1)">',
      deletionDate,
      signInUrl,
    });
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&#60;img");
  });
});
