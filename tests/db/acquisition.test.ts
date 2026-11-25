import { beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Plan d'acquisition (ADR-052) : compteurs de provenance réservés au serveur, parrainage
// (rattachement, récompense unique, plafond, jamais pour soi-même) et lecture du parrain.

type SignedInUser = Awaited<ReturnType<typeof createSignedInUser>>;

async function purchasedBalance(userId: string) {
  const { data, error } = await admin
    .from("credit_wallets")
    .select("purchased_balance")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data.purchased_balance;
}

async function codeOf(userId: string) {
  const { data, error } = await admin.rpc("ensure_referral_code", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}

describe("provenance", () => {
  it("compte une fois chaque paiement, en essai ou en achat, puis efface sa provenance", async () => {
    const session = `cs_test_${crypto.randomUUID()}`;
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Europe/Paris",
    });
    const source = `test-${crypto.randomUUID().slice(0, 8)}`;
    await admin.from("acquisition_checkouts").insert({
      stripe_checkout_session_id: session,
      channel: "campaign",
      source,
    });

    for (let i = 0; i < 2; i += 1) {
      const { error } = await admin.rpc("record_acquisition_checkout", {
        p_session_id: session,
        p_amount_cents: 299,
      });
      expect(error).toBeNull();
    }

    const { data } = await admin
      .from("acquisition_counts")
      .select("event, count, amount_cents")
      .eq("day", today)
      .eq("source", source);
    expect(data).toEqual([{ event: "purchase", count: 1, amount_cents: 299 }]);
    const left = await admin
      .from("acquisition_checkouts")
      .select("source")
      .eq("stripe_checkout_session_id", session);
    expect(left.data).toEqual([]);
  });

  it("les compteurs et les fonctions restent hors de portée des visiteurs et des comptes", async () => {
    const user = await createSignedInUser(testEmail("provenance"));
    for (const client of [anonymousClient(), user.client]) {
      for (const table of [
        "acquisition_counts",
        "acquisition_checkouts",
      ] as const) {
        const { error } = await client.from(table).select("*");
        expect(error?.code).toBe("42501");
      }
      const { error } = await client.rpc("record_acquisition", {
        p_channel: "direct",
        p_source: "direct",
        p_event: "signup",
      });
      expect(error?.code).toBe("42501");
      const reward = await client.rpc("reward_referral", {
        p_referee_id: user.id,
        p_credits: 5,
        p_monthly_cap: 20,
      });
      expect(reward.error?.code).toBe("42501");
    }
  });
});

describe("parrainage", () => {
  let parrain: SignedInUser;
  let filleul: SignedInUser;
  let code: string;

  beforeAll(async () => {
    parrain = await createSignedInUser(testEmail("parrain"));
    filleul = await createSignedInUser(testEmail("filleul"));
    code = await codeOf(parrain.id);
  });

  it("donne un code stable de 8 caractères", async () => {
    expect(code).toMatch(/^[a-z0-9]{8}$/);
    expect(await codeOf(parrain.id)).toBe(code);
  });

  it("refuse de se parrainer soi-même", async () => {
    const { data } = await admin.rpc("attach_referral", {
      p_referee_id: parrain.id,
      p_code: code,
    });
    expect(data).toBe(false);
  });

  it("récompense le parrain et le filleul une seule fois", async () => {
    const attached = await admin.rpc("attach_referral", {
      p_referee_id: filleul.id,
      p_code: code.toUpperCase(),
    });
    expect(attached.data).toBe(true);
    const before = [
      await purchasedBalance(parrain.id),
      await purchasedBalance(filleul.id),
    ];

    for (const expected of [true, false]) {
      const { data } = await admin.rpc("reward_referral", {
        p_referee_id: filleul.id,
        p_credits: 5,
        p_monthly_cap: 20,
      });
      expect(data).toBe(expected);
    }
    expect(await purchasedBalance(parrain.id)).toBe(before[0] + 5);
    expect(await purchasedBalance(filleul.id)).toBe(before[1] + 5);
  });

  it("au-delà du plafond, seul le filleul est récompensé", async () => {
    const autre = await createSignedInUser(testEmail("filleul-plafond"));
    await admin.rpc("attach_referral", {
      p_referee_id: autre.id,
      p_code: code,
    });
    const before = await purchasedBalance(parrain.id);
    const { data } = await admin.rpc("reward_referral", {
      p_referee_id: autre.id,
      p_credits: 5,
      p_monthly_cap: 1,
    });
    expect(data).toBe(true);
    expect(await purchasedBalance(parrain.id)).toBe(before);
    expect(await purchasedBalance(autre.id)).toBeGreaterThanOrEqual(5);
  });

  it("le parrain voit ses filleuls, sans leur identité ; les autres ne voient rien", async () => {
    const own = await parrain.client
      .from("referrals")
      .select("referee_id, referrer_rewarded");
    expect(own.data).toHaveLength(2);
    const other = await filleul.client.from("referrals").select("referee_id");
    expect(other.data).toEqual([]);
    const write = await parrain.client
      .from("referrals")
      .update({ referrer_rewarded: true })
      .eq("referrer_id", parrain.id)
      .select("referee_id");
    expect(write.error?.code).toBe("42501");
  });

  it("un compte ne modifie ni son code ni sa lettre offerte", async () => {
    const { error } = await filleul.client
      .from("profiles")
      .update({ referral_code: "abcdefgh", free_letter_used_at: null })
      .eq("id", filleul.id);
    expect(error?.code).toBe("42501");
  });
});
