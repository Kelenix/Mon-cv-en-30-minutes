import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Contenus générés (Inc-7) : conservés avec le CV (H20), créés seulement par le serveur à la fin
// d'une opération réussie, lisibles et corrigeables par leur propriétaire.

async function cvWithOperation(userId: string) {
  const { data: first } = await admin
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
    p_operation_id: first!.operation_id,
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
  await admin.rpc("grant_credits", {
    p_user_id: userId,
    p_bucket: "purchased",
    p_amount: 5,
    p_reason: "pack_purchase",
  });
  const { data: operation } = await admin
    .rpc("begin_ai_operation", {
      p_user_id: userId,
      p_request_id: randomUUID(),
      p_kind: "improve_summary",
      p_cost: 1,
      p_allow_included: false,
      p_try_free: false,
      p_rate_limit: 100,
      p_free_ip_limit: 0,
    })
    .single();
  return { cvId: cvId!, operationId: operation!.operation_id };
}

function complete(operationId: string, cvId: string) {
  return admin.rpc("complete_ai_operation", {
    p_operation_id: operationId,
    p_model: "simulation",
    p_input_tokens: 10,
    p_output_tokens: 20,
    p_cache_read_tokens: 0,
    p_cost_usd_micros: 400,
    p_duration_ms: 800,
    p_cv_id: cvId,
    p_kind: "summary_variants",
    p_language: "fr",
    p_output: { variants: ["A", "B", "C"] },
  });
}

describe("contenus générés", () => {
  it("sont créés à la fin d'une opération réussie, une seule fois", async () => {
    const user = await createSignedInUser(testEmail("gen-ok"));
    const { cvId, operationId } = await cvWithOperation(user.id);

    const { data: generationId, error } = await complete(operationId, cvId);
    expect(error).toBeNull();
    const { data: operation } = await admin
      .from("ai_operations")
      .select("status, cost_usd_micros")
      .eq("id", operationId)
      .single();
    expect(operation).toEqual({ status: "succeeded", cost_usd_micros: 400 });

    const { data: own } = await user.client
      .from("generations")
      .select("id, kind, output")
      .eq("cv_id", cvId);
    expect(own).toEqual([
      {
        id: generationId,
        kind: "summary_variants",
        output: { variants: ["A", "B", "C"] },
      },
    ]);

    const { error: again } = await complete(operationId, cvId);
    expect(again?.message).toBe("OPERATION_NOT_PENDING");
  });

  it("ne s'attachent pas au CV d'un autre compte", async () => {
    const user = await createSignedInUser(testEmail("gen-owner"));
    const other = await createSignedInUser(testEmail("gen-other"));
    const { operationId } = await cvWithOperation(user.id);
    const { cvId: otherCv } = await cvWithOperation(other.id);

    const { error } = await complete(operationId, otherCv);
    expect(error?.message).toBe("NOT_FOUND");
  });

  it("restent privés : seul le texte se corrige, aucune création ni suppression directe", async () => {
    const user = await createSignedInUser(testEmail("gen-rls"));
    const other = await createSignedInUser(testEmail("gen-rls-other"));
    const { cvId, operationId } = await cvWithOperation(user.id);
    const { data: generationId } = await complete(operationId, cvId);

    expect((await other.client.from("generations").select("id")).data).toEqual(
      [],
    );
    const { data: anonymous } = await anonymousClient()
      .from("generations")
      .select("id");
    expect(anonymous ?? []).toEqual([]);

    const { error: update } = await user.client
      .from("generations")
      .update({ output: { variants: ["Corrigée"] } })
      .eq("id", generationId!);
    expect(update).toBeNull();
    const { error: forbidden } = await user.client
      .from("generations")
      .update({ kind: "linkedin" })
      .eq("id", generationId!);
    expect(forbidden?.code).toBe("42501");

    const { error: insert } = await user.client.from("generations").insert({
      user_id: user.id,
      cv_id: cvId,
      kind: "linkedin",
      language: "fr",
      output: {},
    });
    expect(insert?.code).toBe("42501");
    const { error: remove } = await user.client
      .from("generations")
      .delete()
      .eq("id", generationId!);
    expect(remove?.code).toBe("42501");

    const { error: rpc } = await user.client.rpc("complete_ai_operation", {
      p_operation_id: operationId,
      p_model: "x",
      p_input_tokens: 0,
      p_output_tokens: 0,
      p_cache_read_tokens: 0,
      p_cost_usd_micros: 0,
      p_duration_ms: 0,
    });
    expect(rpc?.code).toBe("42501");
  });

  it("sont supprimés avec leur CV", async () => {
    const user = await createSignedInUser(testEmail("gen-cascade"));
    const { cvId, operationId } = await cvWithOperation(user.id);
    await complete(operationId, cvId);
    await user.client.from("cvs").delete().eq("id", cvId);
    const { data } = await admin
      .from("generations")
      .select("id")
      .eq("cv_id", cvId);
    expect(data).toEqual([]);
  });
});
