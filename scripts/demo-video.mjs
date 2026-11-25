// Vidéo de démonstration (ADR-052, docs/launch-kit) : le vrai parcours, des 5 questions au CV,
// enregistré dans le navigateur, en format vertical (TikTok, Reels, Shorts) et horizontal.
//
// Prérequis : Supabase local et le site compilé lancé sur le port 3100 avec l'IA simulée :
//   AI_SIMULATION=true npx next start -p 3100
// Puis : node scripts/demo-video.mjs [dossier de sortie]
import { mkdirSync, readFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.DEMO_URL ?? "http://localhost:3100";
const MAILPIT = "http://localhost:54324";
const OUT = process.argv[2] ?? "docs/launch-kit/videos";
const fr = JSON.parse(readFileSync("messages/fr.json", "utf8"));

const ANSWERS = [
  "Assistante comptable",
  "Assistante comptable chez Fidal, Lyon, depuis 2022 : saisie des factures, rapprochements bancaires, préparation de la TVA.\nStage de 6 mois chez KPMG en 2021.",
  "Sage, Excel, SAP, rigueur, travail en équipe, anglais professionnel",
  "BTS Comptabilité et gestion, Lycée La Martinière, 2021",
  "Devenir comptable dans un cabinet à taille humaine.",
];

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function latestCode(email) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    const { messages = [] } = await response.json();
    const code = messages[0]?.Subject?.match(/\d{6}/)?.[0];
    if (code) return code;
    await pause(500);
  }
  throw new Error("Code de connexion introuvable dans Mailpit");
}

/** Nouveau compte de démonstration connecté (premier CV gratuit), hors enregistrement. */
async function signedInState(browser) {
  const email = `demo-${crypto.randomUUID()}@exemple.test`;
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/fr/connexion`);
  await page.getByLabel(fr.auth.emailLabel).fill(email);
  await page.getByRole("button", { name: fr.auth.sendCode }).click();
  await page.getByLabel(fr.auth.codeLabel).fill(await latestCode(email));
  await page.getByRole("button", { name: fr.auth.verify }).click();
  await page.waitForURL(/bienvenue/);
  await page.getByLabel(fr.profile.firstName, { exact: true }).fill("Awa");
  await page.getByLabel(fr.profile.lastName, { exact: true }).fill("Diallo");
  await page.getByRole("button", { name: fr.welcome.continue }).click();
  await page.waitForURL(/compte/);
  const state = await context.storageState();
  await context.close();
  return state;
}

async function record(browser, state, name, viewport) {
  const context = await browser.newContext({
    storageState: state,
    viewport,
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: viewport },
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/fr`);
  await pause(2000);
  await page.getByRole("link", { name: fr.home.cta }).first().click();
  await page.waitForURL(/\/fr\/creer/);
  await pause(800);
  for (const [index, answer] of ANSWERS.entries()) {
    const field = page.locator("textarea, input[type=text]").first();
    await field.click();
    await field.pressSequentially(answer, { delay: 12 });
    await pause(500);
    await page
      .getByRole("button", {
        name:
          index === ANSWERS.length - 1 ? fr.wizard.generate : fr.wizard.next,
      })
      .click();
    await pause(700);
  }
  await page.waitForURL(/\/fr\/cv\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await pause(2500);
  await page.mouse.wheel(0, 600);
  await pause(2000);
  await page.mouse.wheel(0, 600);
  await pause(2000);
  const video = page.video();
  await context.close();
  renameSync(await video.path(), join(OUT, `${name}.webm`));
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
await record(browser, await signedInState(browser), "demo-vertical", {
  width: 405,
  height: 720,
});
await record(browser, await signedInState(browser), "demo-horizontal", {
  width: 1280,
  height: 720,
});
await browser.close();
console.log(`Vidéos enregistrées dans ${OUT}`);
