import "server-only";
import type { NextRequest } from "next/server";
import { env } from "@/core/env";
import { countryOf } from "@/lib/geo";
import { ipFromHeaders } from "@/lib/ip-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyVisit, isBot } from "./visits";

const SITE_HOSTNAME = new URL(env.NEXT_PUBLIC_SITE_URL).hostname;

/**
 * Compte une arrivée sur le site (page ouverte depuis l'extérieur, hors robots et
 * préchargements) : canal, source et pays, sans cookie ni adresse IP gardée (ADR-040).
 */
export async function recordVisit(request: NextRequest) {
  const headers = request.headers;
  if (
    request.method !== "GET" ||
    headers.get("sec-fetch-dest") !== "document" ||
    headers.get("sec-fetch-mode") !== "navigate" ||
    headers.has("next-router-prefetch") ||
    headers.get("sec-purpose")?.includes("prefetch") ||
    isBot(headers.get("user-agent"))
  ) {
    return;
  }
  const visit = classifyVisit(request.nextUrl, headers.get("referer"), [
    SITE_HOSTNAME,
    request.nextUrl.hostname,
  ]);
  if (!visit) return;

  const { error } = await createAdminClient().rpc("record_visit", {
    p_channel: visit.channel,
    p_source: visit.source,
    p_country: countryOf(ipFromHeaders(headers)) ?? "ZZ",
  });
  if (error) console.error("Visite non comptée", error.code);
}
