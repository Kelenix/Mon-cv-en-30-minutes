import type { CookieOptionsWithName } from "@supabase/ssr";
import { env } from "@/core/env";

// Cookies de session illisibles par le JavaScript de la page (aucun client Supabase navigateur
// n'est utilisé) et sécurisés dès que le site est servi en HTTPS (docs/architecture.md §6).
export const supabaseCookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NEXT_PUBLIC_SITE_URL.startsWith("https://"),
};
