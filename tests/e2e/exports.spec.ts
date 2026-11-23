import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { unlockCvPro } from "./support/admin";
import { generate, saveDraft } from "./support/cv";

// Exports (Inc-5) : US-16 et US-17. Supabase local doit tourner (Docker).

const { fr } = MESSAGES;
const WATERMARK = "Créé avec Mon CV en 30 Secondes";

/** Clique sur un bouton de téléchargement ; renvoie le nom proposé et le contenu du fichier. */
async function download(page: Page, name: string) {
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name }).click(),
  ]);
  return {
    name: file.suggestedFilename(),
    buffer: await readFile((await file.path())!),
  };
}

async function pdfText(buffer: Buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/\s+/g, " ");
}

test("sans droit : PDF gratuit avec filigrane, DOCX verrouillé et refusé par le serveur", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);

  // PDF gratuit (US-16) : nommé d'après le compte, texte lisible, filigrane en pied de page.
  const pdf = await download(page, fr.cvExport.pdf);
  expect(pdf.name).toBe("CV-Awa-Diallo.pdf");
  const text = await pdfText(pdf.buffer);
  expect(text).toContain("Awa Diallo");
  expect(text.indexOf("PROFIL")).toBeLessThan(
    text.indexOf("EXPÉRIENCE PROFESSIONNELLE"),
  );
  expect(text).toContain("Assistante comptable chez KPMG");
  expect(text).toContain(WATERMARK);

  // DOCX (US-17 c.3) : l'utilisateur voit comment le débloquer…
  await page.getByRole("button", { name: fr.cvExport.docxLockedLabel }).click();
  const details = page.getByRole("dialog", { name: fr.cvExport.lockedTitle });
  await expect(details.getByText(/CV Pro \(4,99\s€\)/)).toBeVisible();
  await expect(
    details.getByRole("link", { name: fr.cvExport.seeOffers }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // … et un appel direct est refusé côté serveur.
  const route = `/api/cv/${cvId}/export`;
  expect((await page.request.get(`${route}?format=docx`)).status()).toBe(403);
  expect((await page.request.get(`${route}?format=odt`)).status()).toBe(400);
});

test("avec CV Pro : PDF sans filigrane et DOCX avec ses rubriques (US-17)", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  await unlockCvPro(cvId);
  await page.reload();

  const pdf = await download(page, fr.cvExport.pdf);
  expect(await pdfText(pdf.buffer)).not.toContain(WATERMARK);

  const docx = await download(page, fr.cvExport.docx);
  expect(docx.name).toBe("CV-Awa-Diallo.docx");
  const { value: html } = await mammoth.convertToHtml({ buffer: docx.buffer });
  expect(html).toContain("<h1>Expérience professionnelle</h1>");
  expect(html).toContain("Assistante comptable chez KPMG");
});

test("le fichier suit la langue du CV ; il est réservé à son propriétaire", async ({
  page,
  context,
}) => {
  await signUp(page);
  await saveDraft(page, {}, "en");
  const cvId = await generate(page);
  const route = `/api/cv/${cvId}/export?format=pdf`;

  // Intitulés et filigrane dans la langue du CV, avec le nom de marque de cette langue (H31).
  const text = await pdfText((await download(page, fr.cvExport.pdf)).buffer);
  expect(text).toContain("PROFESSIONAL EXPERIENCE");
  expect(text).toContain("Created with My CV in 30 Seconds");

  await context.clearCookies();
  expect((await page.request.get(route)).status()).toBe(401);
  await signUp(page);
  expect((await page.request.get(route)).status()).toBe(404);
});
