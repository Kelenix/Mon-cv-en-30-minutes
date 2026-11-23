import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/core/env";

/**
 * Adresse IP du visiteur, hachée avec un sel secret (H27) : jamais stockée en clair. `null` sans
 * sel (développement local) ou sans adresse connue. Sur Vercel, `x-real-ip` est fixée par la
 * plateforme (non falsifiable par le client).
 */
export async function hashClientIp(): Promise<string | null> {
  if (!env.IP_HASH_SALT) return null;
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return null;
  return createHmac("sha256", env.IP_HASH_SALT).update(ip).digest("hex");
}
