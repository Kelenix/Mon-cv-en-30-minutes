import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

// Outils des tests de comptes : adresses uniques, lecture des e-mails dans Mailpit (boîte de
// réception de Supabase local), inscription complète par code.

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export const MESSAGES = { fr, en, de } as const;

export function uniqueEmail() {
  return `e2e-${randomUUID()}@exemple.test`;
}

type MailpitSearch = { messages_count: number; messages: { ID: string }[] };

async function searchMailbox(email: string): Promise<MailpitSearch> {
  const query = encodeURIComponent(`to:"${email}"`);
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`);
  return (await response.json()) as MailpitSearch;
}

export async function emailCount(email: string) {
  return (await searchMailbox(email)).messages_count;
}

/** Attend un e-mail de plus que `previousCount` et renvoie le plus récent. */
export async function waitForEmail(email: string, previousCount = 0) {
  await expect
    .poll(() => emailCount(email), { timeout: 15_000 })
    .toBeGreaterThan(previousCount);
  const { messages } = await searchMailbox(email);
  const response = await fetch(
    `${MAILPIT_URL}/api/v1/message/${messages[0].ID}`,
  );
  const message = (await response.json()) as { Subject: string; HTML: string };
  const code = message.Subject.match(/\d{6}/)?.[0];
  if (!code) throw new Error("Code absent de l'objet de l'e-mail");
  return { subject: message.Subject, html: message.HTML, code };
}

/** Demande un code depuis la page de connexion affichée, puis le saisit. */
export async function signInWithCode(page: Page, email: string) {
  const t = fr.auth;
  const previous = await emailCount(email);
  await page.getByLabel(t.emailLabel).fill(email);
  await page.getByRole("button", { name: t.sendCode }).click();
  await expect(page.getByText(`Code envoyé à ${email}.`)).toBeVisible();
  const { code } = await waitForEmail(email, previous);
  await page.getByLabel(t.codeLabel).fill(code);
  await page.getByRole("button", { name: t.verify }).click();
}

/** Inscription complète en français : code, puis prénom et nom ; termine sur l'espace compte. */
export async function signUp(page: Page, email = uniqueEmail()) {
  await page.goto("/fr/connexion");
  await signInWithCode(page, email);
  await expect(page).toHaveURL(/\/fr\/bienvenue\?next=/);
  await page.getByLabel(fr.profile.firstName, { exact: true }).fill("Awa");
  await page.getByLabel(fr.profile.lastName, { exact: true }).fill("Diallo");
  await page.getByRole("button", { name: fr.welcome.continue }).click();
  await expect(page).toHaveURL(/\/fr\/compte$/);
  return email;
}

export async function expectNoAccessibilityViolations(page: Page) {
  // Le titre des pages rendues à la requête arrive en flux : l'audit attend qu'il soit là.
  await expect(page).toHaveTitle(/\S/);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}
