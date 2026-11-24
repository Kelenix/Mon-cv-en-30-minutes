// Provenance des visites (ADR-040) : canal et source d'une arrivée sur le site, d'après le
// paramètre `utm_source` ou le site d'origine. Aucun cookie, aucune adresse IP gardée : seuls des
// compteurs par jour sont enregistrés.

export type VisitChannel =
  "direct" | "search" | "social" | "referral" | "campaign";

export type Visit = { channel: VisitChannel; source: string };

const SEARCH_ENGINES: [string, RegExp][] = [
  ["google", /(^|\.)google\.[a-z.]+$/],
  ["bing", /(^|\.)bing\.com$/],
  ["duckduckgo", /(^|\.)duckduckgo\.com$/],
  ["qwant", /(^|\.)qwant\.com$/],
  ["ecosia", /(^|\.)ecosia\.org$/],
  ["yahoo", /(^|\.)yahoo\.[a-z.]+$/],
  ["brave", /(^|\.)search\.brave\.com$/],
  ["yandex", /(^|\.)yandex\.[a-z.]+$/],
  ["startpage", /(^|\.)startpage\.com$/],
];

const SOCIAL_NETWORKS: [string, RegExp][] = [
  ["facebook", /(^|\.)(facebook\.com|fb\.com|fb\.me)$/],
  ["instagram", /(^|\.)instagram\.com$/],
  ["linkedin", /(^|\.)(linkedin\.com|lnkd\.in)$/],
  ["x", /(^|\.)(x\.com|twitter\.com|t\.co)$/],
  ["tiktok", /(^|\.)tiktok\.com$/],
  ["youtube", /(^|\.)(youtube\.com|youtu\.be)$/],
  ["pinterest", /(^|\.)pinterest\.[a-z.]+$/],
  ["reddit", /(^|\.)reddit\.com$/],
  ["whatsapp", /(^|\.)whatsapp\.(com|net)$/],
  ["telegram", /(^|\.)(t\.me|telegram\.org)$/],
  ["snapchat", /(^|\.)snapchat\.com$/],
  ["threads", /(^|\.)threads\.(net|com)$/],
];

const BOT =
  /bot|crawl|spider|slurp|preview|fetch|monitor|lighthouse|headless|curl|wget|python|axios|scrapy|uptime/i;

function clean(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Robot, outil ou navigateur automatisé : la visite n'est pas comptée. */
export function isBot(userAgent: string | null) {
  return !userAgent || BOT.test(userAgent);
}

/**
 * Arrivée sur le site depuis `referer` (ou sans), pour l'adresse `url` ; `null` pour une
 * navigation interne (même site).
 */
export function classifyVisit(
  url: URL,
  referer: string | null,
  siteHostnames: string[],
): Visit | null {
  let origin: string | null = null;
  if (referer) {
    try {
      origin = new URL(referer).hostname.toLowerCase();
    } catch {
      origin = null;
    }
  }
  if (origin && siteHostnames.includes(origin)) return null;

  const campaign = url.searchParams.get("utm_source");
  if (campaign && clean(campaign)) {
    return { channel: "campaign", source: clean(campaign) };
  }
  if (!origin) return { channel: "direct", source: "direct" };

  const host = origin.replace(/^www\./, "");
  for (const [name, pattern] of SEARCH_ENGINES) {
    if (pattern.test(host)) return { channel: "search", source: name };
  }
  for (const [name, pattern] of SOCIAL_NETWORKS) {
    if (pattern.test(host)) return { channel: "social", source: name };
  }
  return { channel: "referral", source: clean(host) || "inconnu" };
}
