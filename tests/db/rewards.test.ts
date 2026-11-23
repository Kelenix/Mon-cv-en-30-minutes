import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { admin, createSignedInUser, testEmail } from "./supabase-test-clients";

// Vidéos récompensées (Inc-11, US-35) : un jeton à usage unique par annonce, 1 crédit acheté à
// la fin, 3 par jour au plus ; tout se passe par le serveur.

const DAILY_LIMIT = 3;

function issue(userId: string) {
  return admin.rpc("issue_reward_token", {
    p_user_id: userId,
    p_daily_limit: DAILY_LIMIT,
  });
}

function redeem(userId: string, token: string) {
  return admin.rpc("redeem_reward_token", {
    p_user_id: userId,
    p_token: token,
    p_daily_limit: DAILY_LIMIT,
  });
}

/** Annonce vue : le jeton date de plus de 5 secondes (durée minimale d'une annonce). */
async function watched(token: string) {
  const { error } = await admin
    .from("reward_tokens")
    .update({ created_at: new Date(Date.now() - 10_000).toISOString() })
    .eq("id", token);
  if (error) throw error;
}

async function purchased(userId: string) {
  const { data } = await admin
    .from("credit_wallets")
    .select("purchased_balance")
    .eq("user_id", userId)
    .single();
  return data?.purchased_balance;
}

describe("vidéos récompensées", () => {
  it("1 crédit acheté par annonce vue jusqu'au bout, une seule fois par jeton", async () => {
    const user = await createSignedInUser(testEmail("reward-ok"));
    const { data: token } = await issue(user.id);

    // Trop tôt : l'annonce n'a pas pu être vue.
    expect((await redeem(user.id, token!)).error?.message).toBe("CONFLICT");
    await watched(token!);
    const { data: balance, error } = await redeem(user.id, token!);
    expect(error).toBeNull();
    expect(balance).toBe(1);
    expect(await purchased(user.id)).toBe(1);
    const { data: ledger } = await admin
      .from("credit_ledger")
      .select("bucket, delta, reason")
      .eq("user_id", user.id)
      .eq("reason", "rewarded_ad");
    expect(ledger).toEqual([
      { bucket: "purchased", delta: 1, reason: "rewarded_ad" },
    ]);

    // Jeton déjà utilisé ou inconnu : refusé.
    expect((await redeem(user.id, token!)).error?.message).toBe("CONFLICT");
    expect((await redeem(user.id, randomUUID())).error?.message).toBe(
      "CONFLICT",
    );
  });

  it("au plus 3 crédits par jour (US-35 c.3)", async () => {
    const user = await createSignedInUser(testEmail("reward-limit"));
    const spare = (await issue(user.id)).data!;
    for (let index = 0; index < DAILY_LIMIT; index += 1) {
      const { data: token } = await issue(user.id);
      await watched(token!);
      expect((await redeem(user.id, token!)).error).toBeNull();
    }
    expect(await purchased(user.id)).toBe(DAILY_LIMIT);

    expect((await issue(user.id)).error?.message).toBe("RATE_LIMITED");
    await watched(spare);
    expect((await redeem(user.id, spare)).error?.message).toBe("RATE_LIMITED");
    expect(await purchased(user.id)).toBe(DAILY_LIMIT);
  });

  it("le jeton d'un autre compte ne crédite personne", async () => {
    const owner = await createSignedInUser(testEmail("reward-owner"));
    const other = await createSignedInUser(testEmail("reward-other"));
    const { data: token } = await issue(owner.id);
    await watched(token!);

    expect((await redeem(other.id, token!)).error?.message).toBe("CONFLICT");
    expect(await purchased(other.id)).toBe(0);
  });

  it("réservées au serveur : aucun accès direct aux jetons ni aux fonctions", async () => {
    const user = await createSignedInUser(testEmail("reward-rls"));
    const { data: token } = await issue(user.id);

    const { error: read } = await user.client
      .from("reward_tokens")
      .select("id");
    expect(read?.code).toBe("42501");
    const { error: issueDirect } = await user.client.rpc("issue_reward_token", {
      p_user_id: user.id,
      p_daily_limit: 100,
    });
    expect(issueDirect?.code).toBe("42501");
    const { error: redeemDirect } = await user.client.rpc(
      "redeem_reward_token",
      { p_user_id: user.id, p_token: token!, p_daily_limit: 100 },
    );
    expect(redeemDirect?.code).toBe("42501");
  });
});
