import type { NextRequest } from "next/server";
import { finishSignIn } from "@/features/auth/finish-sign-in";

// Retour de Google (OAuth, échange du code PKCE).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  return finishSignIn(request, "google", (supabase) =>
    code
      ? supabase.auth.exchangeCodeForSession(code)
      : Promise.resolve({ error: "code manquant" }),
  );
}
