import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Rétention des comptes inactifs (Inc-13, US-40) : avertissement à 3 ans moins 30 jours,
// suppression 30 jours après, annulée par une connexion ; jamais pour un compte abonné.

const DAY = 86_400_000;
const daysAgo = (days: number) =>
  new Date(Date.now() - days * DAY).toISOString();

async function inactiveUser(
  label: string,
  inactiveDays: number,
  warnedDaysAgo?: number,
) {
  const user = await createSignedInUser(testEmail(`retention-${label}`), {
    locale: "de",
  });
  const { error } = await admin
    .from("profiles")
    .update({
      first_name: "Ada",
      last_seen_at: daysAgo(inactiveDays),
      retention_warning_sent_at:
        warnedDaysAgo === undefined ? null : daysAgo(warnedDaysAgo),
    })
    .eq("id", user.id);
  if (error) throw error;
  return user;
}

async function claimedIds() {
  const { data, error } = await admin.rpc("claim_retention_warnings", {
    p_limit: 1000,
  });
  if (error) throw error;
  return data;
}

async function dueIds() {
  const { data, error } = await admin.rpc("retention_deletions_due", {
    p_limit: 1000,
  });
  if (error) throw error;
  return data.map((row) => row.user_id);
}

describe("avertissement (US-40 c.1 et c.5)", () => {
  it("avertit une seule fois un compte inactif depuis 3 ans moins 30 jours", async () => {
    const due = await inactiveUser("due", 1095 - 20);
    const early = await inactiveUser("early", 1095 - 40);

    const first = await claimedIds();
    const claimed = first.find((row) => row.user_id === due.id);
    expect(claimed).toMatchObject({ first_name: "Ada", locale: "de" });
    expect(claimed?.email).toMatch(/^db-retention-due-/);
    expect(first.some((row) => row.user_id === early.id)).toBe(false);

    const second = await claimedIds();
    expect(second.some((row) => row.user_id === due.id)).toBe(false);
  });
});

describe("suppression (US-40 c.2)", () => {
  it("concerne les comptes avertis depuis 30 jours et toujours inactifs", async () => {
    const expired = await inactiveUser("expired", 1100, 31);
    const recent = await inactiveUser("recent", 1100, 10);

    const due = await dueIds();
    expect(due).toContain(expired.id);
    expect(due).not.toContain(recent.id);
  });
});

describe("connexion après l'avertissement (US-40 c.3)", () => {
  it("annule la suppression", async () => {
    const user = await inactiveUser("back", 1100, 31);
    expect(await dueIds()).toContain(user.id);

    await user.client.rpc("touch_last_seen");

    expect(await dueIds()).not.toContain(user.id);
    const { data } = await admin
      .from("profiles")
      .select("retention_warning_sent_at")
      .eq("id", user.id)
      .single();
    expect(data?.retention_warning_sent_at).toBeNull();
  });
});

describe("compte abonné (US-40 c.4)", () => {
  it("n'est jamais averti ni supprimé", async () => {
    const subscriber = await inactiveUser("subscriber", 1100);
    const { error } = await admin.rpc("sync_subscription", {
      p_user_id: subscriber.id,
      p_provider_subscription_id: `sub_${randomUUID()}`,
      p_plan: "pro",
      p_interval: "month",
      p_status: "active",
      p_monthly_credits: 60,
      p_trial_credits: 10,
      p_current_period_end: new Date(Date.now() + 30 * DAY).toISOString(),
      p_cancel_at_period_end: false,
    });
    expect(error).toBeNull();

    expect(
      (await claimedIds()).some((row) => row.user_id === subscriber.id),
    ).toBe(false);
    await admin
      .from("profiles")
      .update({ retention_warning_sent_at: daysAgo(31) })
      .eq("id", subscriber.id);
    expect(await dueIds()).not.toContain(subscriber.id);
  });
});

describe("accès", () => {
  it("réserve les fonctions au serveur", async () => {
    const user = await createSignedInUser(testEmail("retention-access"));
    for (const client of [anonymousClient(), user.client]) {
      const claim = await client.rpc("claim_retention_warnings", {
        p_limit: 1,
      });
      const due = await client.rpc("retention_deletions_due", { p_limit: 1 });
      expect(claim.error?.code).toBe("42501");
      expect(due.error?.code).toBe("42501");
    }
  });
});
