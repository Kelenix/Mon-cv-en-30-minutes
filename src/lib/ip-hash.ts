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

/**
 * Adresse IP du visiteur, hachée (H27) : jamais stockée en clair. `null` sans sel ou sans adresse
 * connue. En production, `x-real-ip` est réécrite par le proxy Caddy avec l'adresse de la
 * connexion (non falsifiable par le client, deploy/Caddyfile).
 */
export async function hashClientIp(): Promise<string | null> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip ? saltedHash(ip) : null;
}
