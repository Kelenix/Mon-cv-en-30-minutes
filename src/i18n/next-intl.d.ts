import type messages from "../../messages/fr.json";
import type { AppLocale } from "./routing";

// Typage des clés de traduction : le français est la référence.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
