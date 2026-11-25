import { beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Photos des CV (Inc-15, US-45) : RLS de `cv_photos`, taille maximale, suppression avec le CV ;
// modèle et pays visé modifiables par le propriétaire seulement.

type SignedInUser = Awaited<ReturnType<typeof createSignedInUser>>;

const JPEG = "\\xffd8ffe000104a464946ffd9";

async function createCv(userId: string) {
  const { data, error } = await admin
    .from("cvs")
    .insert({
      user_id: userId,
      title: "Comptable",
      language: "fr",
      answers: { job: "Comptable" },
      content: { header: { fullName: "Awa Diallo", title: "Comptable" } },
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

describe("photos des CV", () => {
  let alice: SignedInUser;
  let bob: SignedInUser;
  let aliceCv: string;

  beforeAll(async () => {
    alice = await createSignedInUser(testEmail("photo-alice"));
    bob = await createSignedInUser(testEmail("photo-bob"));
    aliceCv = await createCv(alice.id);
  });

  it("le propriétaire pose, lit et remplace la photo de son CV", async () => {
    const insert = await alice.client
      .from("cv_photos")
      .upsert({ cv_id: aliceCv, user_id: alice.id, image: JPEG });
    expect(insert.error).toBeNull();
    const { data } = await alice.client
      .from("cv_photos")
      .select("image")
      .eq("cv_id", aliceCv)
      .single();
    expect(data?.image).toBe(JPEG);
  });

  it("un autre compte ne lit ni ne remplace la photo, et n'en pose pas sur ce CV", async () => {
    const read = await bob.client
      .from("cv_photos")
      .select("image")
      .eq("cv_id", aliceCv);
    expect(read.data).toEqual([]);

    // Se faire passer pour le propriétaire, ou se déclarer propriétaire du CV d'un autre.
    for (const userId of [alice.id, bob.id]) {
      const { error } = await bob.client
        .from("cv_photos")
        .insert({ cv_id: aliceCv, user_id: userId, image: JPEG });
      expect(error?.code).toBe("42501");
    }
    const removed = await bob.client
      .from("cv_photos")
      .delete()
      .eq("cv_id", aliceCv)
      .select("cv_id");
    expect(removed.data).toEqual([]);

    const anonymous = await anonymousClient().from("cv_photos").select("image");
    expect(anonymous.error?.code).toBe("42501");
  });

  it("refuse une image de plus de 300 Ko", async () => {
    const tooBig = `\\x${"ff".repeat(307_201)}`;
    const { error } = await alice.client
      .from("cv_photos")
      .upsert({ cv_id: aliceCv, user_id: alice.id, image: tooBig });
    expect(error?.code).toBe("23514");
  });

  it("modèle et pays visé : modifiables par le propriétaire, contrôlés par la base", async () => {
    const own = await alice.client
      .from("cvs")
      .update({ template: "moderne", target_country: "DE" })
      .eq("id", aliceCv)
      .select("template, target_country")
      .single();
    expect(own.data).toEqual({ template: "moderne", target_country: "DE" });

    const unknown = await alice.client
      .from("cvs")
      .update({ template: "inconnu" })
      .eq("id", aliceCv);
    expect(unknown.error?.code).toBe("23514");

    const other = await bob.client
      .from("cvs")
      .update({ template: "elegant" })
      .eq("id", aliceCv)
      .select("id");
    expect(other.data).toEqual([]);
  });

  it("la photo disparaît avec son CV", async () => {
    await admin.from("cvs").delete().eq("id", aliceCv);
    const { count } = await admin
      .from("cv_photos")
      .select("cv_id", { count: "exact", head: true })
      .eq("cv_id", aliceCv);
    expect(count).toBe(0);
  });
});
