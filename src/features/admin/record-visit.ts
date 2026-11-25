import "server-only";
import type { NextRequest } from "next/server";
import { env } from "@/core/env";
import { countryOf } from "@/lib/geo";
import { ipFromHeaders } from "@/lib/ip-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyVisit, isBot, type Visit } from "./visits";

const SITE_HOSTNAME = new URL(env.NEXT_PUBLIC_SITE_URL).hostname;

/**
 * Arrivée sur le site (page ouverte depuis l'extérieur, hors robots et préchargements) : canal
 * et source ; `null` pour une navigation interne ou un robot.
 */
export function arrivalOf(request: NextRequest): Visit | null {
  const headers = request.headers;
  if (
    request.method !== "GET" ||
    headers.get("sec-fetch-dest") !== "document" ||
    headers.get("sec-fetch-mode") !== "navigate" ||
    headers.has("next-router-prefetch") ||
    headers.get("sec-purpose")?.includes("prefetch") ||
    isBot(headers.get("user-agent"))
  ) {
    return null;
  }
  return classifyVisit(request.nextUrl, headers.get("referer"), [
    SITE_HOSTNAME,
    request.nextUrl.hostname,
  ]);
}

/** Compte une arrivée : canal, source et pays, sans adresse IP gardée (ADR-040). */
export async function recordVisit(request: NextRequest, visit: Visit) {
  const headers = request.headers;
  const { error } = await createAdminClient().rpc("record_visit", {
    p_channel: visit.channel,
    p_source: visit.source,
    p_country: countryOf(ipFromHeaders(headers)) ?? "ZZ",
  });
  if (error) console.error("Visite non comptée", error.code);
}
