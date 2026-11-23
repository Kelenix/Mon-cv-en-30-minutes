import type { AppLocale } from "@/i18n/routing";
import type { LegalContent } from "../types";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";

export const LEGAL_CONTENT: Record<AppLocale, LegalContent> = {
  fr,
  en,
  it,
  es,
  de,
};
