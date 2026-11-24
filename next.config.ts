import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";
// Annonces Google (Ad Manager, consentement) : origines nombreuses et variables, autorisées en
// HTTPS dans ce seul mode (ADR-037).
const googleAds = process.env.ADS_MODE === "google";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Vérification anti-robot de la connexion (Cloudflare Turnstile, ADR-039), si configurée.
const turnstile = process.env.TURNSTILE_SITE_KEY
  ? " https://challenges.cloudflare.com"
  : "";

/**
 * Content-Security-Policy (docs/security.md) : ressources du site seulement, plus Supabase ;
 * formulaires vers Supabase puis Google (connexion ; le paiement Stripe est ouvert par script,
 * hors form-action) ; seul cadre permis : Turnstile (anti-robot), s'il est configuré.
 * Les scripts en ligne de Next.js imposent 'unsafe-inline' (pages générées à l'avance, sans nonce).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${googleAds ? " https:" : turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${googleAds ? " https:" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase}${isDev ? " ws:" : ""}${googleAds ? " https:" : ""}`,
  `frame-src ${googleAds ? "https:" : turnstile.trim() || "'none'"}`,
  "worker-src 'self' blob:",
  `form-action 'self' ${supabase} https://accounts.google.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

// En-têtes de sécurité (docs/architecture.md §13).
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  // Serveur autonome pour l'image Docker du VPS (deploy/Dockerfile, ADR-038).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Polices du PDF, lues à l'exécution par la route d'export (docs/architecture.md §10).
  outputFileTracingIncludes: {
    "/api/cv/[id]/export": [
      "./node_modules/@expo-google-fonts/arimo/{400Regular,700Bold}/*.ttf",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
