import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import fr from "../../../messages/fr.json";
import it from "../../../messages/it.json";

const MESSAGES = { fr, en, it, es, de } as const;

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * E-mail d'avertissement avant la suppression d'un compte inactif (US-40 c.1), dans la langue du
 * compte : date de suppression et lien de connexion, qui suffit à l'annuler.
 */
export function retentionWarningEmail({
  locale,
  firstName,
  deletionDate,
  signInUrl,
}: {
  locale: AppLocale;
  firstName: string | null;
  deletionDate: Date;
  signInUrl: string;
}) {
  const messages = MESSAGES[locale];
  const t = createTranslator({
    locale,
    messages,
    namespace: "retentionEmail",
  });
  const brandName = messages.brand.name;
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "Europe/Paris",
  }).format(deletionDate);
  const name = firstName?.trim();
  const greeting = (format: (text: string) => string) =>
    name ? t("greeting", { firstName: format(name) }) : t("greetingNoName");
  const paragraphs = [t("body", { brandName, date }), t("keep")];

  const html = `<!doctype html>
<html lang="${locale}">
<body style="margin: 0;">
<div style="font-family: Arial, sans-serif; color: #0B1F3A; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; margin: 0 0 16px;">${t("title")}</h1>
  <p style="margin: 0 0 16px;">${greeting(escapeHtml)}</p>
${paragraphs.map((text) => `  <p style="margin: 0 0 16px;">${text}</p>`).join("\n")}
  <p style="margin: 8px 0 24px;"><a href="${signInUrl}" style="display: inline-block; background: #0F6FE6; color: #FFFFFF; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: bold;">${t("cta")}</a></p>
  <p style="font-size: 13px; color: #4A5B73; margin: 0;">${t("footer")}</p>
</div>
</body>
</html>`;

  const text = [
    greeting((value) => value),
    "",
    ...paragraphs,
    "",
    t("cta"),
    signInUrl,
    "",
    t("footer"),
  ].join("\n");

  return { subject: t("subject", { brandName, date }), html, text };
}
