import "server-only";
import { createClient } from "@/lib/supabase/server";

// Photo facultative d'un CV (Inc-15, US-45) : JPEG recadré dans le navigateur, lu et écrit par le
// client de l'utilisateur soumis à la RLS (table `cv_photos`, une photo par CV).

/** Vrai JPEG complet : marqueurs de début (FF D8 FF) et de fin (FF D9). */
export function isJpeg(image: Buffer) {
  return (
    image.length > 4 &&
    image[0] === 0xff &&
    image[1] === 0xd8 &&
    image[2] === 0xff &&
    image.at(-2) === 0xff &&
    image.at(-1) === 0xd9
  );
}

/** PostgREST échange le type `bytea` en hexadécimal (`\x…`). */
const toHex = (image: Buffer) => `\\x${image.toString("hex")}`;
const fromHex = (value: string) =>
  Buffer.from(value.replace(/^\\x/, ""), "hex");

export async function getOwnCvPhoto(cvId: string): Promise<Buffer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cv_photos")
    .select("image")
    .eq("cv_id", cvId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromHex(data.image) : null;
}

export async function hasOwnCvPhoto(cvId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("cv_photos")
    .select("cv_id", { count: "exact", head: true })
    .eq("cv_id", cvId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Pose ou remplace la photo ; `false` si le CV n'appartient pas au compte. */
export async function saveOwnCvPhoto(
  userId: string,
  cvId: string,
  image: Buffer,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cv_photos")
    .upsert({ cv_id: cvId, user_id: userId, image: toHex(image) });
  return !error;
}

export async function deleteOwnCvPhoto(cvId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cv_photos").delete().eq("cv_id", cvId);
  return !error;
}
