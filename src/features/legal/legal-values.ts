import "server-only";
import { env } from "@/core/env";
import type { LegalValues } from "./interpolate";

/** Valeurs insérées dans les pages légales : variables `LEGAL_*` et nom de marque de la langue. */
export function legalValues(brandName: string): LegalValues {
  return {
    brandName,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    companyName: env.LEGAL_COMPANY_NAME,
    legalForm: env.LEGAL_FORM,
    registration: env.LEGAL_REGISTRATION,
    address: env.LEGAL_ADDRESS,
    email: env.LEGAL_EMAIL,
    publisher: env.LEGAL_PUBLISHER,
    vatNumber: env.LEGAL_VAT_NUMBER,
    hosting: env.LEGAL_HOSTING,
    mediator: env.LEGAL_MEDIATOR,
  };
}
