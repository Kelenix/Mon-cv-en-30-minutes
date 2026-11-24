import { describe, expect, it } from "vitest";
import { classifyVisit, isBot } from "@/features/admin/visits";
import { paymentMethodLabel } from "@/features/billing/stripe-mapping";
import type Stripe from "stripe";

// Administration (Inc-14, ADR-040) : provenance des visites et moyens de paiement.

const SITE = ["moncv.exemple"];
const page = (query = "") => new URL(`https://moncv.exemple/fr${query}`);

describe("provenance d'une visite", () => {
  it("reconnaît les moteurs de recherche, les réseaux sociaux et les autres sites", () => {
    expect(classifyVisit(page(), "https://www.google.fr/", SITE)).toEqual({
      channel: "search",
      source: "google",
    });
    expect(classifyVisit(page(), "https://duckduckgo.com/?q=cv", SITE)).toEqual(
      { channel: "search", source: "duckduckgo" },
    );
    expect(classifyVisit(page(), "https://l.facebook.com/l.php", SITE)).toEqual(
      { channel: "social", source: "facebook" },
    );
    expect(classifyVisit(page(), "https://t.co/abc", SITE)).toEqual({
      channel: "social",
      source: "x",
    });
    expect(classifyVisit(page(), "https://www.lnkd.in/x", SITE)).toEqual({
      channel: "social",
      source: "linkedin",
    });
    expect(
      classifyVisit(page(), "https://blog.exemple.org/article", SITE),
    ).toEqual({ channel: "referral", source: "blog.exemple.org" });
  });

  it("donne la priorité à la campagne (utm_source), nettoyée", () => {
    expect(
      classifyVisit(
        page("?utm_source=Newsletter Nov"),
        "https://mail.google.com/",
        SITE,
      ),
    ).toEqual({
      channel: "campaign",
      source: "newsletter-nov",
    });
  });

  it("compte l'accès direct, ignore la navigation interne", () => {
    expect(classifyVisit(page(), null, SITE)).toEqual({
      channel: "direct",
      source: "direct",
    });
    expect(
      classifyVisit(page(), "https://moncv.exemple/fr/tarifs", SITE),
    ).toBeNull();
    expect(classifyVisit(page(), "pas une adresse", SITE)).toEqual({
      channel: "direct",
      source: "direct",
    });
  });

  it("écarte les robots et les navigateurs automatisés", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("Mozilla/5.0 HeadlessChrome/140.0")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(
      isBot("Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36"),
    ).toBe(false);
  });
});

describe("moyen de paiement", () => {
  const method = (value: object) => value as Stripe.PaymentMethod;

  it("distingue les portefeuilles d'une carte et les autres moyens", () => {
    expect(
      paymentMethodLabel(
        method({ type: "card", card: { wallet: { type: "apple_pay" } } }),
      ),
    ).toBe("apple_pay");
    expect(
      paymentMethodLabel(method({ type: "card", card: { wallet: null } })),
    ).toBe("card");
    expect(paymentMethodLabel(method({ type: "paypal" }))).toBe("paypal");
    expect(paymentMethodLabel(method({ type: "sepa_debit" }))).toBe(
      "sepa_debit",
    );
  });

  it("ne devine rien quand le moyen n'est pas développé", () => {
    expect(paymentMethodLabel("pm_123")).toBeNull();
    expect(paymentMethodLabel(null)).toBeNull();
  });
});
