import type { MetadataRoute } from "next";
import { env } from "@/core/env";

// robots.txt (US-39 c.1) : tout le site est exploré, sauf les routes techniques ; les pages
// privées (création, compte, CV, connexion) portent « noindex », qu'un robot doit pouvoir lire.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] }],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
