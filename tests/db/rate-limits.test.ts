import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Plafonds de la connexion contre les robots (Inc-13, ADR-039).

function consume(key: string, limit = 3) {
  return admin.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: 3600,
  });
}

describe("plafond par clé", () => {
  it("permet le nombre prévu de demandes puis refuse", async () => {
    const key = `test:${randomUUID()}`;
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await consume(key)).data);
    expect(results).toEqual([true, true, true, false]);
    expect((await consume(`test:${randomUUID()}`)).data).toBe(true);
  });

  it("n'est jamais dépassé par des demandes simultanées", async () => {
    const key = `test:${randomUUID()}`;
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consume(key, 5)),
    );
    expect(results.filter((result) => result.data === true)).toHaveLength(5);
  });
});

describe("accès", () => {
  it("réserve le plafond et ses compteurs au serveur", async () => {
    const user = await createSignedInUser(testEmail("rate-limit"));
    for (const client of [anonymousClient(), user.client]) {
      const call = await client.rpc("consume_rate_limit", {
        p_key: "test:x",
        p_limit: 100,
        p_window_seconds: 60,
      });
      expect(call.error?.code).toBe("42501");
      const read = await client.from("rate_limit_events").select("key");
      expect(read.error?.code).toBe("42501");
    }
  });
});
