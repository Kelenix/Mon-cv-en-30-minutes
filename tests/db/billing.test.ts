import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Paiements (Inc-6) : achats uniques, abonnements, remise mensuelle et maintenance
// (docs/system-design.md §6.2 et §6.3, US-18 à US-23, H24, H25).

type Status = Database["public"]["Enums"]["subscription_status"];
type Plan = Database["public"]["Enums"]["plan_tier"];

const QUOTA: Record<Plan, number> = { essential: 20, pro: 60, premium: 150 };
const DAY = 86_400_000;

async function wallet(userId: string) {
  const { data } = await admin
    .from("credit_wallets")
    .select("included_balance, purchased_balance")
    .eq("user_id", userId)
    .single();
  return data!;
}

async function subscription(userId: string) {
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data!;
}

function sync(
  userId: string,
  subscriptionId: string,
  status: Status,
  plan: Plan = "pro",
) {
  return admin.rpc("sync_subscription", {
    p_user_id: userId,
    p_provider_subscription_id: subscriptionId,
    p_plan: plan,
    p_interval: "month",
    p_status: status,
    p_monthly_credits: QUOTA[plan],
    p_trial_credits: 10,
    p_current_period_end: new Date(Date.now() + 30 * DAY).toISOString(),
    p_cancel_at_period_end: false,
    p_trial_ends_at:
      status === "trialing"
        ? new Date(Date.now() + 3 * DAY).toISOString()
        : undefined,
  });
}

function fulfill(
  userId: string,
  product: Database["public"]["Enums"]["purchase_product"],
  sessionId = `cs_test_${randomUUID()}`,
  extra: { credits?: number; cvId?: string } = {},
) {
  return admin.rpc("fulfill_purchase", {
    p_user_id: userId,
    p_product: product,
    p_session_id: sessionId,
    p_amount_cents: 699,
    p_currency: "eur",
    p_terms_accepted_at: new Date().toISOString(),
    p_credits: extra.credits,
    p_cv_id: extra.cvId,
  });
}

async function newCv(userId: string) {
  const { data: operation } = await admin
    .rpc("begin_ai_operation", {
      p_user_id: userId,
      p_request_id: randomUUID(),
      p_kind: "generate_cv",
      p_cost: 1,
      p_allow_included: false,
      p_try_free: true,
      p_rate_limit: 100,
      p_free_ip_limit: 100,
    })
    .single();
  const { data: cvId } = await admin.rpc("complete_cv_generation", {
    p_operation_id: operation!.operation_id,
    p_title: "Comptable",
    p_language: "fr",
    p_answers: {},
    p_content: {},
    p_model: "simulation",
    p_input_tokens: 0,
    p_output_tokens: 0,
    p_cache_read_tokens: 0,
    p_cost_usd_micros: 0,
    p_duration_ms: 0,
  });
  return cvId!;
}

describe("accès (RLS)", () => {
  it("chacun lit son abonnement et ses achats, sans pouvoir les écrire", async () => {
    const alice = await createSignedInUser(testEmail("billing-alice"));
    const bob = await createSignedInUser(testEmail("billing-bob"));
    await sync(alice.id, `sub_${randomUUID()}`, "active");
    await fulfill(alice.id, "credits_5", undefined, { credits: 5 });

    const own = await alice.client.from("subscriptions").select("plan");
    expect(own.data).toEqual([{ plan: "pro" }]);
    const purchases = await alice.client.from("purchases").select("product");
    expect(purchases.data).toEqual([{ product: "credits_5" }]);

    expect((await bob.client.from("subscriptions").select("id")).data).toEqual(
      [],
    );
    expect((await bob.client.from("purchases").select("id")).data).toEqual([]);
    const { data: anonymous } = await anonymousClient()
      .from("subscriptions")
      .select("id");
    expect(anonymous ?? []).toEqual([]);

    const { error: update } = await alice.client
      .from("subscriptions")
      .update({ plan: "premium" })
      .eq("user_id", alice.id);
    expect(update?.code).toBe("42501");
    const { error: rpc } = await alice.client.rpc("fulfill_purchase", {
      p_user_id: alice.id,
      p_product: "credits_40",
      p_session_id: "cs_fake",
      p_amount_cents: 0,
      p_currency: "eur",
      p_terms_accepted_at: new Date().toISOString(),
      p_credits: 40,
    });
    expect(rpc?.code).toBe("42501");
    const { error: events } = await alice.client
      .from("stripe_events")
      .select("id");
    expect(events?.code).toBe("42501");
  });
});

describe("achats uniques", () => {
  it("un pack ajoute ses crédits une seule fois, même si Stripe confirme deux fois (US-18 c.2)", async () => {
    const user = await createSignedInUser(testEmail("billing-pack"));
    const session = `cs_test_${randomUUID()}`;
    expect(
      (await fulfill(user.id, "credits_15", session, { credits: 15 })).data,
    ).toBe(true);
    expect(
      (await fulfill(user.id, "credits_15", session, { credits: 15 })).data,
    ).toBe(false);
    expect(await wallet(user.id)).toEqual({
      included_balance: 0,
      purchased_balance: 15,
    });

    const { data: ledger } = await admin
      .from("credit_ledger")
      .select("delta, reason, purchase_id")
      .eq("user_id", user.id);
    expect(ledger).toHaveLength(1);
    expect(ledger![0]).toMatchObject({ delta: 15, reason: "pack_purchase" });
    expect(ledger![0].purchase_id).not.toBeNull();
  });

  it("un CV Pro débloque ce CV seulement, et exige un CV (US-19)", async () => {
    const user = await createSignedInUser(testEmail("billing-cvpro"));
    const other = await createSignedInUser(testEmail("billing-cvpro-other"));
    const cvId = await newCv(user.id);
    const otherCv = await newCv(other.id);

    const { error } = await fulfill(user.id, "cv_pro");
    expect(error?.message).toBe("CV_REQUIRED");

    const session = `cs_test_${randomUUID()}`;
    await fulfill(user.id, "cv_pro", session, { cvId });
    await fulfill(user.id, "cv_pro", undefined, { cvId: otherCv });
    const { data } = await admin
      .from("cvs")
      .select("id, pro_unlocked_at")
      .in("id", [cvId, otherCv]);
    const unlocked = Object.fromEntries(
      data!.map((cv) => [cv.id, cv.pro_unlocked_at !== null]),
    );
    expect(unlocked).toEqual({ [cvId]: true, [otherCv]: false });

    // Le CV remplacé ou supprimé garde la trace de l'achat (H22).
    await admin.from("cvs").delete().eq("id", cvId);
    const { data: purchase } = await admin
      .from("purchases")
      .select("cv_id")
      .eq("stripe_checkout_session_id", session);
    expect(purchase).toEqual([{ cv_id: null }]);
  });

  it("le retrait des publicités est enregistré dans le profil", async () => {
    const user = await createSignedInUser(testEmail("billing-ads"));
    await fulfill(user.id, "ads_removal");
    const { data } = await admin
      .from("profiles")
      .select("ads_removed_at")
      .eq("id", user.id)
      .single();
    expect(data?.ads_removed_at).not.toBeNull();
  });
});

describe("abonnements", () => {
  it("essai, premier paiement, montée, descente puis fin (US-20, US-21, US-22, H24, H25)", async () => {
    const user = await createSignedInUser(testEmail("billing-life"));
    const id = `sub_${randomUUID()}`;
    await fulfill(user.id, "credits_5", undefined, { credits: 5 });

    // Essai : 10 crédits inclus, essai consommé, pas de remise mensuelle.
    await sync(user.id, id, "trialing");
    expect(await wallet(user.id)).toEqual({
      included_balance: 10,
      purchased_balance: 5,
    });
    expect((await subscription(user.id)).next_credit_grant_at).toBeNull();
    const { data: profile } = await admin
      .from("profiles")
      .select("trial_used_at")
      .eq("id", user.id)
      .single();
    expect(profile?.trial_used_at).not.toBeNull();

    // Même état reçu deux fois : rien de plus.
    await sync(user.id, id, "trialing");
    expect((await wallet(user.id)).included_balance).toBe(10);

    // Fin de l'essai : 60 crédits remplacent les crédits d'essai, prochaine remise dans un mois.
    await sync(user.id, id, "active");
    expect((await wallet(user.id)).included_balance).toBe(60);
    const next = new Date((await subscription(user.id)).next_credit_grant_at!);
    expect(next.getTime()).toBeGreaterThan(Date.now() + 27 * DAY);

    // Paiement en retard : droits maintenus, rien ne change.
    await sync(user.id, id, "past_due");
    expect((await wallet(user.id)).included_balance).toBe(60);

    // Montée immédiate : quota de la nouvelle formule (H25).
    await sync(user.id, id, "active", "premium");
    expect((await wallet(user.id)).included_balance).toBe(150);

    // Descente : nouveau quota à la prochaine remise, solde inchangé.
    await sync(user.id, id, "active", "essential");
    expect((await wallet(user.id)).included_balance).toBe(150);
    expect((await subscription(user.id)).monthly_credits).toBe(20);

    // Fin : crédits inclus perdus, crédits achetés conservés (H24).
    await sync(user.id, id, "canceled", "essential");
    expect(await wallet(user.id)).toEqual({
      included_balance: 0,
      purchased_balance: 5,
    });
    expect((await subscription(user.id)).status).toBe("canceled");
  });

  it("un événement tardif d'un ancien abonnement ne touche pas le nouveau", async () => {
    const user = await createSignedInUser(testEmail("billing-late"));
    const old = `sub_${randomUUID()}`;
    const current = `sub_${randomUUID()}`;
    await sync(user.id, old, "active");
    await sync(user.id, old, "canceled");
    await sync(user.id, current, "active", "premium");
    await sync(user.id, old, "canceled");

    expect((await subscription(user.id)).provider_subscription_id).toBe(
      current,
    );
    expect((await wallet(user.id)).included_balance).toBe(150);
  });
});

describe("tâches planifiées", () => {
  it("la remise mensuelle a lieu une fois par mois, sans report ni effet sur les achats (US-23)", async () => {
    const user = await createSignedInUser(testEmail("billing-grant"));
    await fulfill(user.id, "credits_5", undefined, { credits: 5 });
    await sync(user.id, `sub_${randomUUID()}`, "active");

    // Remise due, et la moitié du quota déjà dépensée.
    await admin.rpc("set_included_credits", {
      p_user_id: user.id,
      p_amount: 30,
      p_reason: "monthly_grant",
    });
    await admin
      .from("subscriptions")
      .update({
        next_credit_grant_at: new Date(Date.now() - 60_000).toISOString(),
      })
      .eq("user_id", user.id);

    expect((await admin.rpc("run_monthly_grants")).data).toBeGreaterThan(0);
    expect(await wallet(user.id)).toEqual({
      included_balance: 60,
      purchased_balance: 5,
    });
    const next = new Date((await subscription(user.id)).next_credit_grant_at!);
    expect(next.getTime()).toBeGreaterThan(Date.now());

    // Relance immédiate : aucune remise de plus pour ce compte.
    await admin.rpc("set_included_credits", {
      p_user_id: user.id,
      p_amount: 12,
      p_reason: "monthly_grant",
    });
    await admin.rpc("run_monthly_grants");
    expect((await wallet(user.id)).included_balance).toBe(12);
  });

  it("la maintenance rembourse les opérations restées en cours et efface les données anciennes", async () => {
    const user = await createSignedInUser(testEmail("billing-maintenance"));
    await fulfill(user.id, "credits_5", undefined, { credits: 5 });
    await newCv(user.id);
    const { data: operation } = await admin
      .rpc("begin_ai_operation", {
        p_user_id: user.id,
        p_request_id: randomUUID(),
        p_kind: "generate_cv",
        p_cost: 1,
        p_allow_included: false,
        p_try_free: true,
        p_rate_limit: 100,
        p_free_ip_limit: 100,
        p_ip_hash: "hash-ancien",
      })
      .single();
    expect((await wallet(user.id)).purchased_balance).toBe(4);
    const old = new Date(Date.now() - 31 * DAY).toISOString();
    await admin
      .from("ai_operations")
      .update({ created_at: old })
      .eq("id", operation!.operation_id);
    const eventId = `evt_${randomUUID()}`;
    await admin.from("stripe_events").insert({
      id: eventId,
      type: "test",
      created_at: new Date(Date.now() - 91 * DAY).toISOString(),
    });

    await admin.rpc("run_daily_maintenance");

    expect((await wallet(user.id)).purchased_balance).toBe(5);
    const { data: stale } = await admin
      .from("ai_operations")
      .select("status, error_code, ip_hash")
      .eq("id", operation!.operation_id)
      .single();
    expect(stale).toEqual({
      status: "failed",
      error_code: "STALE",
      ip_hash: null,
    });
    const { data: events } = await admin
      .from("stripe_events")
      .select("id")
      .eq("id", eventId);
    expect(events).toEqual([]);
  });
});
