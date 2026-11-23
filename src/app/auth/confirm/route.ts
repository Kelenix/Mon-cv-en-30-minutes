import type { NextRequest } from "next/server";
import { finishSignIn } from "@/features/auth/finish-sign-in";

// Lien de connexion de secours contenu dans l'e-mail du code (fonctionne dans un autre
// navigateur que celui qui a demandé le code).
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");

  return finishSignIn(request, "lien", (supabase) =>
    tokenHash
      ? supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
      : Promise.resolve({ error: "jeton manquant" }),
  );
}
