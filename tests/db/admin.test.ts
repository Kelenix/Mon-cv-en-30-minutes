import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Administration (Inc-14, ADR-040) : lectures réservées au serveur, visites comptées sans
// donnée personnelle, revenus gardés anonymes après la suppression d'un compte.

describe("accès", () => {
  it("réserve les fonctions et les tables de l'administration au serveur", async () => {
    const user = await createSignedInUser(testEmail("admin-access"));
    for (const client of [anonymousClient(), user.client]) {
      const calls = await Promise.all([
        client.rpc("admin_summary", { p_days: 30 }),
        client.rpc("admin_daily", { p_days: 30 }),
        client.rpc("admin_users", {
          p_search: "",
          p_plan: "",
          p_limit: 5,
          p_offset: 0,
        }),
        client.rpc("admin_user_detail", { p_user_id: user.id }),
        client.rpc("admin_system"),
        client.rpc("record_visit", {
          p_channel: "direct",
          p_source: "direct",
          p_country: "FR",
        }),
      ]);
      for (const call of calls) expect(call.error?.code).toBe("42501");
      for (const table of [
        "site_visits",
        "admin_audit_log",
        "job_runs",
        "subscription_invoices",
      ] as const) {
        const read = await client.from(table).select("*").limit(1);
        expect(read.error?.code).toBe("42501");
      }
    }
  });
});

describe("visites", () => {
  it("additionne les arrivées par jour, canal, source et pays", async () => {
    const source = `test-${randomUUID().slice(0, 8)}`;
    for (let i = 0; i < 3; i++) {
      const { error } = await admin.rpc("record_visit", {
        p_channel: "referral",
        p_source: source,
        p_country: "IT",
      });
      expect(error).toBeNull();
    }
    const { data } = await admin
      .from("site_visits")
      .select("visits, country")
      .eq("source", source);
    expect(data).toEqual([{ visits: 3, country: "IT" }]);
  });
});

describe("statistiques et fiches", () => {
  it("donne une série par jour et retrouve un compte par son e-mail", async () => {
    const email = testEmail("admin-search");
    const user = await createSignedInUser(email);
    await admin
      .from("profiles")
      .update({ signup_country: "BE", first_name: "Léa" })
      .eq("id", user.id);

    const { data: daily } = await admin.rpc("admin_daily", { p_days: 7 });
    expect(daily).toHaveLength(7);
    expect(daily!.at(-1)!.signups).toBeGreaterThanOrEqual(1);

    const { data: rows } = await admin.rpc("admin_users", {
      p_search: email,
      p_plan: "",
      p_limit: 5,
      p_offset: 0,
    });
    expect(rows).toHaveLength(1);
    expect(rows![0]).toMatchObject({
      id: user.id,
      country: "BE",
      first_name: "Léa",
      total: 1,
    });

    const { data: detail } = await admin.rpc("admin_user_detail", {
      p_user_id: user.id,
    });
    expect(detail).toMatchObject({
      email,
      country: "BE",
      providers: ["email"],
    });
    const { data: none } = await admin.rpc("admin_user_detail", {
      p_user_id: randomUUID(),
    });
    expect(none).toBeNull();
  });
});

describe("compte supprimé", () => {
  it("garde ses paiements et ses coûts d'IA, anonymes", async () => {
    const user = await createSignedInUser(testEmail("admin-erase"));
    const sessionId = `cs_test_${randomUUID()}`;
    const { error } = await admin.rpc("fulfill_purchase", {
      p_user_id: user.id,
      p_product: "credits_5",
      p_session_id: sessionId,
      p_amount_cents: 299,
      p_currency: "eur",
      p_terms_accepted_at: new Date().toISOString(),
      p_credits: 5,
    });
    expect(error).toBeNull();

    await admin.auth.admin.deleteUser(user.id);

    const { data } = await admin
      .from("purchases")
      .select("user_id, amount_cents")
      .eq("stripe_checkout_session_id", sessionId)
      .single();
    expect(data).toEqual({ user_id: null, amount_cents: 299 });
  });
});
