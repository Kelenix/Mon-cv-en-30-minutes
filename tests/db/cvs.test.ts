import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// CV et génération (Inc-4) : RLS de `cvs` (docs/data-model.md §4), début, fin et échec d'une
// génération (docs/system-design.md §6.1, US-11, H22, H27).

type SignedInUser = Awaited<ReturnType<typeof createSignedInUser>>;

const CONTENT = {
  header: { fullName: "Awa Diallo", title: "Comptable" },
  summary: "",
  experiences: [],
  skills: [],
  education: [],
  languages: [],
};
const ANSWERS = {
  job: "Comptable",
  experiences: "",
  skills: "",
  education: "",
  goal: "",
};

function begin(
  userId: string,
  options: {
    requestId?: string;
    ipHash?: string;
    rateLimit?: number;
    tryFree?: boolean;
  } = {},
) {
  return admin
    .rpc("begin_ai_operation", {
      p_user_id: userId,
      p_request_id: options.requestId ?? randomUUID(),
      p_kind: "generate_cv",
      p_cost: 1,
      p_allow_included: false,
      p_try_free: options.tryFree ?? true,
      p_rate_limit: options.rateLimit ?? 100,
      p_free_ip_limit: 3,
      p_ip_hash: options.ipHash,
    })
    .single();
}

function complete(
  operationId: string,
  options: { replaceCvId?: string; cvLimit?: number } = {},
) {
  return admin.rpc("complete_cv_generation", {
    p_operation_id: operationId,
    p_title: "Comptable",
    p_language: "fr",
    p_answers: ANSWERS,
    p_content: CONTENT,
    p_model: "simulation",
    p_input_tokens: 0,
    p_output_tokens: 0,
    p_cache_read_tokens: 0,
    p_cost_usd_micros: 0,
    p_duration_ms: 1200,
    p_replace_cv_id: options.replaceCvId,
    p_cv_limit: options.cvLimit,
  });
}

/** Génération réussie complète ; renvoie l'identifiant du CV. */
async function generate(userId: string) {
  const { data: operation, error } = await begin(userId);
  if (error) throw error;
  const { data: cvId, error: completeError } = await complete(
    operation.operation_id,
  );
  if (completeError) throw completeError;
  return cvId;
}

async function purchased(userId: string) {
  const { data } = await admin
    .from("credit_wallets")
    .select("purchased_balance")
    .eq("user_id", userId)
    .single();
  return data?.purchased_balance;
}

async function grant(userId: string, amount: number) {
  const { error } = await admin.rpc("grant_credits", {
    p_user_id: userId,
    p_bucket: "purchased",
    p_amount: amount,
    p_reason: "pack_purchase",
  });
  if (error) throw error;
}

async function freeUsedAt(userId: string) {
  const { data } = await admin
    .from("profiles")
    .select("free_generation_used_at")
    .eq("id", userId)
    .single();
  return data?.free_generation_used_at;
}

describe("accès aux CV (RLS)", () => {
  let alice: SignedInUser;
  let bob: SignedInUser;
  let aliceCv: string;

  beforeAll(async () => {
    alice = await createSignedInUser(testEmail("cv-alice"));
    bob = await createSignedInUser(testEmail("cv-bob"));
    aliceCv = await generate(alice.id);
  });

  it("un visiteur anonyme ne lit aucun CV", async () => {
    const { data } = await anonymousClient().from("cvs").select("id");
    expect(data ?? []).toEqual([]);
  });

  it("chacun ne lit que ses propres CV", async () => {
    const { data: own } = await alice.client.from("cvs").select("id");
    expect(own?.map((cv) => cv.id)).toEqual([aliceCv]);
    const { data: other } = await bob.client
      .from("cvs")
      .select("id")
      .eq("id", aliceCv);
    expect(other).toEqual([]);
  });

  it("le titre et le contenu se corrigent, sans toucher aux autres colonnes", async () => {
    const { data, error } = await alice.client
      .from("cvs")
      .update({ title: "Comptable confirmée", content: CONTENT })
      .eq("id", aliceCv)
      .select("title");
    expect(error).toBeNull();
    expect(data?.[0].title).toBe("Comptable confirmée");

    for (const values of [
      { language: "en" as const },
      { answers: {} },
      { pro_unlocked_at: new Date().toISOString() },
      { user_id: bob.id },
    ]) {
      const { error: forbidden } = await alice.client
        .from("cvs")
        .update(values)
        .eq("id", aliceCv);
      expect(forbidden?.code, JSON.stringify(values)).toBe("42501");
    }
  });

  it("un autre compte ne modifie ni ne supprime le CV", async () => {
    await bob.client.from("cvs").update({ title: "Piraté" }).eq("id", aliceCv);
    await bob.client.from("cvs").delete().eq("id", aliceCv);
    const { data } = await admin
      .from("cvs")
      .select("title")
      .eq("id", aliceCv)
      .single();
    expect(data?.title).toBe("Comptable confirmée");
  });

  it("aucun CV ne se crée sans génération", async () => {
    const { error } = await alice.client.from("cvs").insert({
      user_id: alice.id,
      title: "Faux",
      language: "fr",
      answers: ANSWERS,
      content: CONTENT,
    });
    expect(error?.code).toBe("42501");
  });

  it("le contenu est limité à 64 Ko", async () => {
    const { error } = await alice.client
      .from("cvs")
      .update({ content: { ...CONTENT, summary: "a".repeat(70_000) } })
      .eq("id", aliceCv);
    expect(error?.code).toBe("23514");
  });

  it("chacun supprime ses propres CV", async () => {
    const { error } = await alice.client.from("cvs").delete().eq("id", aliceCv);
    expect(error).toBeNull();
    const { data } = await admin.from("cvs").select("id").eq("id", aliceCv);
    expect(data).toEqual([]);
  });

  it("les fonctions de génération sont réservées au serveur", async () => {
    const { error } = await alice.client.rpc("begin_ai_operation", {
      p_user_id: alice.id,
      p_request_id: randomUUID(),
      p_kind: "generate_cv",
      p_cost: 0,
      p_allow_included: true,
      p_try_free: true,
      p_rate_limit: 100,
      p_free_ip_limit: 100,
    });
    expect(error?.code).toBe("42501");
    const { error: failError } = await alice.client.rpc("fail_ai_operation", {
      p_operation_id: randomUUID(),
      p_error_code: "x",
    });
    expect(failError?.code).toBe("42501");
  });
});

describe("génération de CV", () => {
  it("la première est gratuite, et la gratuité n'est consommée qu'au succès (US-11 c.1)", async () => {
    const user = await createSignedInUser(testEmail("cv-free"));
    const { data: operation } = await begin(user.id);
    expect(operation?.was_free).toBe(true);
    expect(await freeUsedAt(user.id)).toBeNull();

    // Échec : rien n'est consommé, la génération suivante reste gratuite.
    const { data: refunded } = await admin.rpc("fail_ai_operation", {
      p_operation_id: operation!.operation_id,
      p_error_code: "AI_UNAVAILABLE:test",
    });
    expect(refunded).toBe(0);
    const { data: retry } = await begin(user.id);
    expect(retry?.was_free).toBe(true);

    await complete(retry!.operation_id);
    expect(await freeUsedAt(user.id)).not.toBeNull();
    const { data: status } = await admin
      .from("ai_operations")
      .select("status, finished_at, duration_ms")
      .eq("id", retry!.operation_id)
      .single();
    expect(status).toMatchObject({ status: "succeeded", duration_ms: 1200 });
  });

  it("ensuite, une génération coûte 1 crédit, rendu en cas d'échec (US-11 c.2, c.6)", async () => {
    const user = await createSignedInUser(testEmail("cv-paid"));
    await generate(user.id);

    const { error: insufficient } = await begin(user.id);
    expect(insufficient?.message).toBe("INSUFFICIENT_CREDITS");
    const { count } = await admin
      .from("ai_operations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    expect(count).toBe(1);

    await grant(user.id, 2);
    const { data: paid } = await begin(user.id);
    expect(paid?.was_free).toBe(false);
    expect(await purchased(user.id)).toBe(1);

    const { data: refunded } = await admin.rpc("fail_ai_operation", {
      p_operation_id: paid!.operation_id,
      p_error_code: "AI_UNAVAILABLE:test",
    });
    expect(refunded).toBe(1);
    expect(await purchased(user.id)).toBe(2);

    // Un second échec signalé ne rend rien de plus.
    const { data: again } = await admin.rpc("fail_ai_operation", {
      p_operation_id: paid!.operation_id,
      p_error_code: "AI_UNAVAILABLE:test",
    });
    expect(again).toBe(0);
    expect(await purchased(user.id)).toBe(2);
  });

  it("une même demande n'est ni débitée ni lancée deux fois", async () => {
    const user = await createSignedInUser(testEmail("cv-replay"));
    await generate(user.id);
    await grant(user.id, 3);
    const requestId = randomUUID();

    const { data: first } = await begin(user.id, { requestId });
    const { data: replay } = await begin(user.id, { requestId });
    expect(first?.created).toBe(true);
    expect(replay).toMatchObject({
      operation_id: first?.operation_id,
      created: false,
      status: "pending",
    });
    expect(await purchased(user.id)).toBe(2);
  });

  it("une génération gratuite en cours bloque une seconde demande gratuite", async () => {
    const user = await createSignedInUser(testEmail("cv-pending"));
    await begin(user.id);
    const { error } = await begin(user.id);
    expect(error?.message).toBe("RATE_LIMITED");
  });

  it("la limite d'opérations par minute s'applique", async () => {
    const user = await createSignedInUser(testEmail("cv-rate"));
    await grant(user.id, 5);
    await begin(user.id, { tryFree: false, rateLimit: 2 });
    await begin(user.id, { tryFree: false, rateLimit: 2 });
    const { error } = await begin(user.id, { tryFree: false, rateLimit: 2 });
    expect(error?.message).toBe("RATE_LIMITED");
    expect(await purchased(user.id)).toBe(3);
  });

  it("une adresse IP n'obtient pas plus de 3 générations gratuites par jour (H27)", async () => {
    const ipHash = randomUUID();
    for (let index = 0; index < 3; index++) {
      const user = await createSignedInUser(testEmail(`cv-ip-${index}`));
      const { data } = await begin(user.id, { ipHash });
      expect(data?.was_free).toBe(true);
    }
    const fourth = await createSignedInUser(testEmail("cv-ip-4"));
    const { error } = await begin(fourth.id, { ipHash });
    expect(error?.message).toBe("FREE_LIMIT_REACHED");
    // Depuis une autre adresse, la gratuité reste disponible.
    const { data } = await begin(fourth.id, { ipHash: randomUUID() });
    expect(data?.was_free).toBe(true);
  });

  it("au-delà du nombre de CV conservés, il faut remplacer un CV (H22)", async () => {
    const user = await createSignedInUser(testEmail("cv-limit"));
    const firstCv = await generate(user.id);
    await grant(user.id, 2);

    const { data: blocked } = await begin(user.id);
    const { error } = await complete(blocked!.operation_id, { cvLimit: 1 });
    expect(error?.message).toBe("CV_LIMIT_REACHED");
    const { data: stillPending } = await admin
      .from("ai_operations")
      .select("status")
      .eq("id", blocked!.operation_id)
      .single();
    expect(stillPending?.status).toBe("pending");

    const { data: replacing } = await begin(user.id);
    const { data: newCv, error: replaceError } = await complete(
      replacing!.operation_id,
      { cvLimit: 1, replaceCvId: firstCv },
    );
    expect(replaceError).toBeNull();
    const { data: cvs } = await admin
      .from("cvs")
      .select("id")
      .eq("user_id", user.id);
    expect(cvs?.map((cv) => cv.id)).toEqual([newCv]);
  });

  it("on ne remplace pas le CV d'un autre compte", async () => {
    const owner = await createSignedInUser(testEmail("cv-owner"));
    const intruder = await createSignedInUser(testEmail("cv-intruder"));
    const ownerCv = await generate(owner.id);
    const { data: operation } = await begin(intruder.id);
    const { error } = await complete(operation!.operation_id, {
      replaceCvId: ownerCv,
    });
    expect(error?.message).toBe("NOT_FOUND");
    const { data } = await admin.from("cvs").select("id").eq("id", ownerCv);
    expect(data).toHaveLength(1);
  });

  it("une opération déjà terminée ne crée pas un second CV", async () => {
    const user = await createSignedInUser(testEmail("cv-twice"));
    const { data: operation } = await begin(user.id);
    await complete(operation!.operation_id);
    const { error } = await complete(operation!.operation_id);
    expect(error?.message).toBe("OPERATION_NOT_PENDING");
  });
});
