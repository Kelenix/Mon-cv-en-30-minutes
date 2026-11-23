import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Crédits (Inc-3) : US-07 à US-09, NFR-08 (intégrité du journal), R07 (double débit).

type SignedInUser = Awaited<ReturnType<typeof createSignedInUser>>;
type OperationKind = Database["public"]["Enums"]["ai_operation_kind"];
let alice: SignedInUser;
let bob: SignedInUser;

async function wallet(userId: string) {
  const { data, error } = await admin
    .from("credit_wallets")
    .select("included_balance, purchased_balance")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function grant(
  userId: string,
  bucket: "included" | "purchased",
  amount: number,
) {
  const { error } = await admin.rpc("grant_credits", {
    p_user_id: userId,
    p_bucket: bucket,
    p_amount: amount,
    p_reason: bucket === "included" ? "monthly_grant" : "pack_purchase",
  });
  if (error) throw error;
}

async function newOperation(
  userId: string,
  kind: OperationKind = "cover_letter",
) {
  const { data, error } = await admin
    .from("ai_operations")
    .insert({ user_id: userId, request_id: randomUUID(), kind })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

function spend(
  userId: string,
  operationId: string,
  cost: number,
  allowIncluded = true,
) {
  return admin.rpc("spend_credits", {
    p_user_id: userId,
    p_operation_id: operationId,
    p_cost: cost,
    p_allow_included: allowIncluded,
  });
}

/** NFR-08 : la somme du journal est égale au solde, pour chaque type de crédit. */
async function expectLedgerMatchesWallet(userId: string) {
  const { data, error } = await admin
    .from("credit_ledger")
    .select("bucket, delta")
    .eq("user_id", userId);
  if (error) throw error;
  const sum = (bucket: string) =>
    data
      .filter((row) => row.bucket === bucket)
      .reduce((total, row) => total + row.delta, 0);
  const balances = await wallet(userId);
  expect(sum("included")).toBe(balances.included_balance);
  expect(sum("purchased")).toBe(balances.purchased_balance);
}

beforeAll(async () => {
  alice = await createSignedInUser(testEmail("credits-alice"));
  bob = await createSignedInUser(testEmail("credits-bob"));
});

afterAll(async () => {
  for (const user of [alice, bob]) {
    if (user) await admin.auth.admin.deleteUser(user.id);
  }
});

describe("portefeuille", () => {
  it("est créé vide à l'inscription", async () => {
    expect(await wallet(alice.id)).toEqual({
      included_balance: 0,
      purchased_balance: 0,
    });
  });

  it("n'est lisible que par son propriétaire, et jamais modifiable directement", async () => {
    await grant(bob.id, "purchased", 3);

    const own = await alice.client.from("credit_wallets").select("user_id");
    expect(own.data).toEqual([{ user_id: alice.id }]);

    const anonymous = await anonymousClient()
      .from("credit_wallets")
      .select("user_id");
    expect(anonymous.error?.code).toBe("42501");

    const update = await alice.client
      .from("credit_wallets")
      .update({ purchased_balance: 999 })
      .eq("user_id", alice.id);
    expect(update.error?.code).toBe("42501");
  });

  it("refuse aux utilisateurs l'appel des fonctions de crédit", async () => {
    const forged = await alice.client.rpc("grant_credits", {
      p_user_id: alice.id,
      p_bucket: "purchased",
      p_amount: 100,
      p_reason: "pack_purchase",
    });
    expect(forged.error?.code).toBe("42501");
    expect((await wallet(alice.id)).purchased_balance).toBe(0);
  });
});

describe("débit d'une opération IA (US-08)", () => {
  it("consomme les crédits inclus d'abord, puis les crédits achetés", async () => {
    await grant(alice.id, "included", 1);
    await grant(alice.id, "purchased", 5);
    const { data, error } = await spend(
      alice.id,
      await newOperation(alice.id),
      2,
    );
    expect(error).toBeNull();
    expect(data).toEqual([{ included_balance: 0, purchased_balance: 4 }]);
    await expectLedgerMatchesWallet(alice.id);
  });

  it("n'utilise que les crédits achetés quand la formule l'impose (Essential, Q2)", async () => {
    await grant(alice.id, "included", 10);
    const { data } = await spend(
      alice.id,
      await newOperation(alice.id),
      2,
      false,
    );
    expect(data).toEqual([{ included_balance: 10, purchased_balance: 2 }]);
  });

  it("refuse un solde insuffisant sans rien débiter", async () => {
    const before = await wallet(alice.id);
    const { error } = await spend(
      alice.id,
      await newOperation(alice.id),
      3,
      false,
    );
    expect(error?.message).toBe("INSUFFICIENT_CREDITS");
    expect(await wallet(alice.id)).toEqual(before);
  });

  it("ne débite qu'une fois la même opération (double clic, rejeu)", async () => {
    const operationId = await newOperation(alice.id);
    await spend(alice.id, operationId, 1);
    const before = await wallet(alice.id);
    const replay = await spend(alice.id, operationId, 1);
    expect(replay.error).toBeNull();
    expect(await wallet(alice.id)).toEqual(before);
  });

  it("refuse une opération appartenant à un autre compte", async () => {
    const { error } = await spend(bob.id, await newOperation(alice.id), 1);
    expect(error?.message).toBe("OPERATION_NOT_FOUND");
  });

  it("garde un identifiant de requête unique par compte (idempotence)", async () => {
    const requestId = randomUUID();
    const first = await admin
      .from("ai_operations")
      .insert({ user_id: alice.id, request_id: requestId, kind: "linkedin" });
    const second = await admin
      .from("ai_operations")
      .insert({ user_id: alice.id, request_id: requestId, kind: "linkedin" });
    expect(first.error).toBeNull();
    expect(second.error?.code).toBe("23505");
  });
});

describe("remboursement (US-08 c.4)", () => {
  it("rend les crédits dans leurs soldes d'origine, une seule fois", async () => {
    await admin.rpc("set_included_credits", {
      p_user_id: alice.id,
      p_amount: 1,
      p_reason: "monthly_grant",
    });
    const before = await wallet(alice.id);
    const operationId = await newOperation(alice.id);
    await spend(alice.id, operationId, 2);

    const first = await admin.rpc("refund_operation", {
      p_operation_id: operationId,
    });
    const second = await admin.rpc("refund_operation", {
      p_operation_id: operationId,
    });
    expect(first.data).toBe(2);
    expect(second.data).toBe(0);
    expect(await wallet(alice.id)).toEqual(before);
    await expectLedgerMatchesWallet(alice.id);
  });
});

describe("remise des crédits inclus", () => {
  it("porte le solde inclus au quota, sans report du reste (ADR-004)", async () => {
    await grant(alice.id, "included", 7);
    const { data } = await admin.rpc("set_included_credits", {
      p_user_id: alice.id,
      p_amount: 20,
      p_reason: "monthly_grant",
    });
    expect(data?.[0].included_balance).toBe(20);
    await expectLedgerMatchesWallet(alice.id);
  });

  it("remet le solde inclus à zéro en fin d'abonnement, crédits achetés intacts", async () => {
    const purchased = (await wallet(alice.id)).purchased_balance;
    const { data } = await admin.rpc("set_included_credits", {
      p_user_id: alice.id,
      p_amount: 0,
      p_reason: "subscription_end",
    });
    expect(data).toEqual([
      { included_balance: 0, purchased_balance: purchased },
    ]);
    await expectLedgerMatchesWallet(alice.id);
  });
});

describe("journal des mouvements (NFR-08)", () => {
  it("est lisible par son propriétaire seulement et ne peut pas être modifié", async () => {
    const own = await alice.client.from("credit_ledger").select("user_id");
    expect(own.data?.every((row) => row.user_id === alice.id)).toBe(true);
    expect(own.data?.length).toBeGreaterThan(0);

    const { data: row } = await admin
      .from("credit_ledger")
      .select("id")
      .eq("user_id", alice.id)
      .limit(1)
      .single();
    const tampered = await admin
      .from("credit_ledger")
      .update({ delta: 1000 })
      .eq("id", row!.id);
    expect(tampered.error?.message).toBe("LEDGER_IMMUTABLE");
  });

  it("n'expose pas les opérations IA aux utilisateurs", async () => {
    const { error } = await alice.client.from("ai_operations").select("id");
    expect(error?.code).toBe("42501");
  });
});

describe("opérations simultanées (US-08 c.5, R07)", () => {
  it("ne laisse jamais le solde devenir négatif", async () => {
    const carol = await createSignedInUser(testEmail("credits-carol"));
    await grant(carol.id, "purchased", 5);
    const operations = await Promise.all(
      Array.from({ length: 20 }, () => newOperation(carol.id)),
    );

    const results = await Promise.all(
      operations.map((operationId) => spend(carol.id, operationId, 1)),
    );

    expect(results.filter((result) => result.error === null)).toHaveLength(5);
    expect(
      results.filter(
        (result) => result.error?.message === "INSUFFICIENT_CREDITS",
      ),
    ).toHaveLength(15);
    expect(await wallet(carol.id)).toEqual({
      included_balance: 0,
      purchased_balance: 0,
    });
    await expectLedgerMatchesWallet(carol.id);

    // Suppression du compte : portefeuille, journal et opérations disparaissent avec lui.
    await admin.auth.admin.deleteUser(carol.id);
    for (const table of [
      "credit_wallets",
      "credit_ledger",
      "ai_operations",
    ] as const) {
      const { data } = await admin
        .from(table)
        .select("user_id")
        .eq("user_id", carol.id);
      expect(data, table).toEqual([]);
    }
  });
});
