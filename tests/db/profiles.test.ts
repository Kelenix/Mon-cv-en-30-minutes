import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  admin,
  anonymousClient,
  createSignedInUser,
  testEmail,
} from "./supabase-test-clients";

// Règles d'accès de `profiles` (docs/data-model.md §4) et déclencheurs de l'Inc-2.

type SignedInUser = Awaited<ReturnType<typeof createSignedInUser>>;
let alice: SignedInUser;
let bob: SignedInUser;

async function profileOf(id: string) {
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

beforeAll(async () => {
  alice = await createSignedInUser(testEmail("alice"), { locale: "it" });
  bob = await createSignedInUser(testEmail("bob"));
});

afterAll(async () => {
  for (const user of [alice, bob]) {
    if (user) await admin.auth.admin.deleteUser(user.id);
  }
});

describe("création du profil à l'inscription", () => {
  it("crée un profil sans nom, dans la langue demandée", async () => {
    const profile = await profileOf(alice.id);
    expect(profile.locale).toBe("it");
    expect(profile.first_name).toBeNull();
    expect(profile.last_name).toBeNull();
  });

  it("utilise l'anglais quand la langue est absente ou inconnue", async () => {
    expect((await profileOf(bob.id)).locale).toBe("en");
  });
});

describe("lecture", () => {
  it("refuse toute lecture à un visiteur anonyme", async () => {
    const { error } = await anonymousClient().from("profiles").select("id");
    expect(error?.code).toBe("42501");
  });

  it("ne montre à un utilisateur que son propre profil", async () => {
    const { data, error } = await alice.client.from("profiles").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([{ id: alice.id }]);
  });
});

describe("modification", () => {
  it("autorise les colonnes saisies par l'utilisateur sur son profil", async () => {
    const { error } = await alice.client
      .from("profiles")
      .update({
        first_name: "Alice",
        last_name: "Rossi",
        phone: "+39 06 1234",
        city: "Roma",
      })
      .eq("id", alice.id);
    expect(error).toBeNull();
    expect(await profileOf(alice.id)).toMatchObject({
      first_name: "Alice",
      last_name: "Rossi",
      city: "Roma",
    });
  });

  it("n'atteint pas le profil d'un autre utilisateur", async () => {
    const { data, error } = await alice.client
      .from("profiles")
      .update({ first_name: "Pirate" })
      .eq("id", bob.id)
      .select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect((await profileOf(bob.id)).first_name).toBeNull();
  });

  it.each([
    { stripe_customer_id: "cus_faux" },
    { free_generation_used_at: null },
    { trial_used_at: null },
    { ads_removed_at: new Date().toISOString() },
    { last_seen_at: new Date().toISOString() },
  ])(
    "refuse la modification d'une colonne réservée au serveur : %o",
    async (values) => {
      const { error } = await alice.client
        .from("profiles")
        .update(values)
        .eq("id", alice.id);
      expect(error?.code).toBe("42501");
    },
  );

  it("applique les longueurs maximales", async () => {
    const { error } = await alice.client
      .from("profiles")
      .update({ first_name: "x".repeat(61) })
      .eq("id", alice.id);
    expect(error?.code).toBe("23514");
  });

  it("refuse la création et la suppression directes", async () => {
    const insert = await alice.client.from("profiles").insert({ id: bob.id });
    expect(insert.error?.code).toBe("42501");
    const remove = await alice.client
      .from("profiles")
      .delete()
      .eq("id", alice.id);
    expect(remove.error?.code).toBe("42501");
  });
});

describe("activité du compte (rétention, US-40)", () => {
  it("met à jour la dernière activité et annule l'avertissement de suppression", async () => {
    const old = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString();
    await admin
      .from("profiles")
      .update({ last_seen_at: old, retention_warning_sent_at: old })
      .eq("id", bob.id);

    const { error } = await bob.client.rpc("touch_last_seen");
    expect(error).toBeNull();

    const profile = await profileOf(bob.id);
    expect(new Date(profile.last_seen_at).getTime()).toBeGreaterThan(
      Date.now() - 60_000,
    );
    expect(profile.retention_warning_sent_at).toBeNull();
  });

  it("n'écrit pas plus d'une fois par jour", async () => {
    const before = (await profileOf(bob.id)).updated_at;
    await bob.client.rpc("touch_last_seen");
    expect((await profileOf(bob.id)).updated_at).toBe(before);
  });

  it("n'est pas appelable sans session", async () => {
    const { error } = await anonymousClient().rpc("touch_last_seen");
    expect(error?.code).toBe("42501");
  });
});

describe("suppression du compte (US-06)", () => {
  it("supprime le profil avec le compte, sans laisser de donnée personnelle", async () => {
    const carol = await createSignedInUser(testEmail("carol"), {
      locale: "fr",
    });
    await carol.client
      .from("profiles")
      .update({ first_name: "Carole", city: "Nantes" })
      .eq("id", carol.id);

    const { error } = await admin.auth.admin.deleteUser(carol.id);
    expect(error).toBeNull();

    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("id", carol.id);
    expect(data).toEqual([]);
    const { data: user } = await admin.auth.admin.getUserById(carol.id);
    expect(user.user).toBeNull();
  });
});
