import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Détection de la langue, préfixe d'adresse et cookie de préférence (ADR-019).
export default createMiddleware(routing);

export const config = {
  // Exclut les routes techniques (API, retour d'authentification, fichiers de Next.js et
  // fichiers statiques comportant un point).
  matcher: ["/((?!api/|auth/|_next/|_vercel/|.*\\..*).*)"],
};
