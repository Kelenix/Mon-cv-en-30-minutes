import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Contenus générés (Inc-7 à Inc-9) : conservés avec le CV (H20), créés seulement par le serveur à
// la fin d'une opération réussie, lisibles par leur propriétaire ; seuls la version LinkedIn et la
// lettre se corrigent (H21) ; un retour d'entretien gratuit et unique (US-30).

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

async function begin(userId: string, kind: "linkedin" | "interview_feedback") {
  const { data } = await admin
    .rpc("begin_ai_operation", {
      p_user_id: userId,
      p_request_id: randomUUID(),
      p_kind: kind,
      p_cost: kind === "linkedin" ? 1 : 0,
      p_allow_included: false,
      p_try_free: false,
      p_rate_limit: 100,
      p_free_ip_limit: 0,
    })
    .single();
  return data!.operation_id;
}

const METRICS = {
  p_model: "simulation",
  p_input_tokens: 10,
  p_output_tokens: 20,
  p_cache_read_tokens: 0,
  p_cost_usd_micros: 400,
  p_duration_ms: 800,
};

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

    // Accroches (comme adaptation et entretien) : non modifiables, le serveur les relit.
    const { data: unchanged } = await user.client
      .from("generations")
      .update({ output: { variants: ["Corrigée"] } })
      .eq("id", generationId!)
      .select("id");
    expect(unchanged).toEqual([]);
    // Version LinkedIn : le texte se corrige.
    const { data: linkedinId } = await admin.rpc("complete_ai_operation", {
      p_operation_id: await begin(user.id, "linkedin"),
      ...METRICS,
      p_cv_id: cvId,
      p_kind: "linkedin",
      p_language: "fr",
      p_output: { headline: "Comptable", about: "", experiences: [] },
    });
    const { data: corrected } = await user.client
      .from("generations")
      .update({ output: { headline: "Comptable confirmée" } })
      .eq("id", linkedinId!)
      .select("output");
    expect(corrected).toEqual([
      { output: { headline: "Comptable confirmée" } },
    ]);
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

describe("retour d'entretien", () => {
  const QUESTIONS = Array.from(
    { length: 8 },
    (_, index) => `Question ${index + 1}`,
  );
  const ANSWERS = ["Ma réponse", "", "", "", "", "", "", ""];
  const FEEDBACK = [
    { index: 0, strengths: "Clair", improvements: "Un exemple", example: "…" },
  ];

  async function interview(userId: string) {
    const { cvId, operationId } = await cvWithOperation(userId);
    const { data } = await admin.rpc("complete_ai_operation", {
      p_operation_id: operationId,
      ...METRICS,
      p_cv_id: cvId,
      p_kind: "interview",
      p_language: "fr",
      p_input: { position: "Comptable" },
      p_output: { questions: QUESTIONS },
    });
    return data!;
  }

  function feedback(operationId: string, generationId: string) {
    return admin.rpc("complete_interview_feedback", {
      p_operation_id: operationId,
      ...METRICS,
      p_generation_id: generationId,
      p_answers: ANSWERS,
      p_feedback: FEEDBACK,
    });
  }

  async function balances(userId: string) {
    const { data } = await admin
      .from("credit_wallets")
      .select("included_balance, purchased_balance")
      .eq("user_id", userId)
      .single();
    return data;
  }

  it("est gratuit, conservé avec la simulation et donné une seule fois", async () => {
    const user = await createSignedInUser(testEmail("gen-interview"));
    const generationId = await interview(user.id);
    const before = await balances(user.id);

    const operationId = await begin(user.id, "interview_feedback");
    expect(await balances(user.id)).toEqual(before);
    expect((await feedback(operationId, generationId)).error).toBeNull();

    const { data } = await user.client
      .from("generations")
      .select("input, output")
      .eq("id", generationId)
      .single();
    expect(data).toEqual({
      input: { position: "Comptable", answers: ANSWERS },
      output: { questions: QUESTIONS, feedback: FEEDBACK },
    });
    const { data: operation } = await admin
      .from("ai_operations")
      .select("kind, status, credits_charged")
      .eq("id", operationId)
      .single();
    expect(operation).toEqual({
      kind: "interview_feedback",
      status: "succeeded",
      credits_charged: 0,
    });

    // Second retour : refusé (les réponses, écrites par le serveur seul, font foi).
    const { error } = await feedback(
      await begin(user.id, "interview_feedback"),
      generationId,
    );
    expect(error?.message).toBe("CONFLICT");
  });

  it("ne vaut que pour une simulation du même compte, par le serveur", async () => {
    const user = await createSignedInUser(testEmail("gen-interview-owner"));
    const other = await createSignedInUser(testEmail("gen-interview-other"));
    const generationId = await interview(user.id);
    await interview(other.id);

    const { error } = await feedback(
      await begin(other.id, "interview_feedback"),
      generationId,
    );
    expect(error?.message).toBe("NOT_FOUND");

    const { error: rpc } = await user.client.rpc(
      "complete_interview_feedback",
      {
        p_operation_id: await begin(user.id, "interview_feedback"),
        ...METRICS,
        p_generation_id: generationId,
        p_answers: ANSWERS,
        p_feedback: FEEDBACK,
      },
    );
    expect(rpc?.code).toBe("42501");
  });
});
