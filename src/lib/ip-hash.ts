import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/core/env";

/**
 * Empreinte d'une donnée personnelle (adresse IP, e-mail) avec le sel secret du serveur, pour la
 * compter sans la stocker en clair. `null` sans sel (développement local : plafonds inactifs).
 */
export function saltedHash(value: string): string | null {
  if (!env.IP_HASH_SALT) return null;
  return createHmac("sha256", env.IP_HASH_SALT).update(value).digest("hex");
}

/** Adresse IP d'une requête, d'après l'en-tête posé par le proxy Caddy. */
export function ipFromHeaders(requestHeaders: Headers): string | null {
  return (
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

/**
 * Adresse IP du visiteur, jamais stockée en clair. En production, `x-real-ip` est réécrite par le
 * proxy Caddy avec l'adresse de la connexion (non falsifiable par le client, deploy/Caddyfile).
 */
export async function clientIp(): Promise<string | null> {
  return ipFromHeaders(await headers());
}

/** Adresse IP hachée (H27) ; `null` sans sel ou sans adresse connue. */
export async function hashClientIp(): Promise<string | null> {
  const ip = await clientIp();
  return ip ? saltedHash(ip) : null;
}
