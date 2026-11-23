import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;
type ProfileUpdate = Pick<
  Database["public"]["Tables"]["profiles"]["Update"],
  "first_name" | "last_name" | "phone" | "city" | "locale"
>;

// Accès au profil du compte connecté, toujours par le client de l'utilisateur : la RLS limite
// la lecture et l'écriture à sa propre ligne et aux colonnes autorisées.

export async function getOwnProfile(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, city, locale")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateOwnProfile(
  supabase: Client,
  userId: string,
  values: ProfileUpdate,
) {
  const { error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userId);
  return { error };
}
