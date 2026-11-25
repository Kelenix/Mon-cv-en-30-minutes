import { getCurrentUser } from "@/features/auth/session";
import { getOwnCv } from "@/features/cv/repository";
import { getOwnCvPhoto } from "@/features/cv/photo";

/**
 * Photo d'un CV (US-45), pour l'aperçu dans l'éditeur : session et RLS (404 pour le CV d'un autre
 * compte ou sans photo), jamais mise en cache partagé.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/cv/[id]/photo">,
) {
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });
  const cv = await getOwnCv((await params).id);
  const photo = cv ? await getOwnCvPhoto(cv.id) : null;
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
