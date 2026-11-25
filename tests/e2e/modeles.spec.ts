import { expect, test } from "@playwright/test";
import { extractText, getDocumentProxy } from "unpdf";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { unlockCvPro } from "./support/admin";
import { ANSWERS, generate, saveDraft } from "./support/cv";

// Modèles de CV (Inc-15, ADR-050) : galerie, choix enregistré, modèles payants essayés en aperçu
// et refusés au téléchargement sans droit. Supabase local doit tourner (Docker).

const { fr } = MESSAGES;
const t = fr.cvTemplates;

async function pdfText(buffer: Buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/\s+/g, " ");
}

test("galerie : un modèle payant s'essaie en aperçu, son téléchargement demande une formule", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  const picker = page.getByRole("region", { name: t.label });
  await expect(picker).toContainText(t.names["ats-classique"]);

  // Galerie : les 6 modèles, avec leurs badges.
  await picker.getByRole("button", { name: t.change }).click();
  const gallery = page.getByRole("dialog", { name: t.dialogTitle });
  await expect(
    gallery.getByRole("button", { pressed: true }),
  ).toHaveAccessibleName(t.names["ats-classique"]);
  await expect(gallery.getByRole("listitem")).toHaveCount(6);
  await expectNoAccessibilityViolations(page);

  // Modèle payant : choisi et enregistré, PDF verrouillé, aperçu marqué « Aperçu ».
  await gallery
    .getByRole("button", { name: t.names.moderne, exact: true })
    .click();
  await expect(gallery).toBeHidden();
  // Choix enregistré côté serveur (bouton de nouveau actif) avant d'appeler l'export.
  await expect(page.getByRole("button", { name: t.change })).toBeEnabled();
  await expect(picker).toContainText(t.names.moderne);
  await expect(picker).toContainText(t.atsWarning);
  await page.getByRole("button", { name: fr.cvExport.pdfLockedLabel }).click();
  await expect(
    page.getByRole("dialog", { name: fr.cvExport.templateLockedTitle }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  const route = `/api/cv/${cvId}/export?format=pdf`;
  expect((await page.request.get(route)).status()).toBe(403);
  const preview = await page.request.get(`${route}&apercu=1`);
  expect(preview.status()).toBe(200);
  expect(preview.headers()["content-disposition"]).toMatch(/^inline;/);
  expect(await pdfText(await preview.body())).toContain(fr.cvDocument.preview);

  // Le choix est conservé.
  await page.reload();
  await expect(page.getByRole("region", { name: t.label })).toContainText(
    t.names.moderne,
  );

  // Modèle gratuit : téléchargement possible, sans mention « Aperçu ».
  await page
    .getByRole("region", { name: t.label })
    .getByRole("button", { name: t.change })
    .click();
  await page
    .getByRole("button", { name: t.names.europeen, exact: true })
    .click();
  await expect(page.getByRole("link", { name: fr.cvExport.pdf })).toBeVisible();
  // Choix enregistré côté serveur (bouton de nouveau actif) avant d'appeler l'export.
  await expect(page.getByRole("button", { name: t.change })).toBeEnabled();
  const free = await page.request.get(route);
  expect(free.status()).toBe(200);
  expect(await pdfText(await free.body())).not.toContain(fr.cvDocument.preview);
});

test("avec CV Pro : tous les modèles se téléchargent, sans filigrane", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  await unlockCvPro(cvId);
  await page.reload();

  await page.getByRole("button", { name: t.change }).click();
  await page
    .getByRole("button", { name: t.names.elegant, exact: true })
    .click();
  await expect(page.getByRole("link", { name: fr.cvExport.pdf })).toBeVisible();
  // Choix enregistré côté serveur (bouton de nouveau actif) avant d'appeler l'export.
  await expect(page.getByRole("button", { name: t.change })).toBeEnabled();

  const file = await page.request.get(`/api/cv/${cvId}/export?format=pdf`);
  expect(file.status()).toBe(200);
  const text = await pdfText(await file.body());
  expect(text).toContain("Awa Diallo");
  expect(text).not.toContain(fr.cvDocument.preview);
  expect(text).not.toContain("Créé avec");
});

test("pays visé : modèle recommandé à la création, galerie et conseil photo par pays", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page, {}, undefined, "DE");
  await generate(page);

  // Allemagne sans formule : le premier recommandé gratuit, le format européen.
  const picker = page.getByRole("region", { name: t.label });
  await expect(picker).toContainText(t.names.europeen);

  await picker.getByRole("button", { name: t.change }).click();
  const gallery = page.getByRole("dialog", { name: t.dialogTitle });
  const country = gallery.getByLabel(t.countryLabel);
  await expect(country).toHaveValue("DE");
  const first = gallery.getByRole("listitem").first();
  await expect(first.getByRole("button")).toHaveAccessibleName(
    t.names.lebenslauf,
  );
  await expect(first).toContainText(t.badges.recommended);

  // États-Unis : modèles ATS d'abord, photo déconseillée ; le pays est enregistré.
  await country.selectOption("US");
  await expect(
    gallery.getByRole("listitem").first().getByRole("button"),
  ).toHaveAccessibleName(t.names["ats-classique"]);
  await expect(gallery).toContainText(
    t.photoAdvice.avoid.replace("{country} : ", ""),
  );
  await page.keyboard.press("Escape");
  // Bouton de nouveau actif : enregistrement du pays terminé.
  await expect(page.getByRole("button", { name: t.change })).toBeEnabled();
  await page.reload();
  await page.getByRole("button", { name: t.change }).click();
  await expect(
    page
      .getByRole("dialog", { name: t.dialogTitle })
      .getByLabel(t.countryLabel),
  ).toHaveValue("US");
});

/** Image PNG d'un pixel : recadrée et convertie en JPEG par le navigateur. */
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("photo facultative : posée, affichée, exportée dans le PDF, puis retirée (US-45)", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  const picker = page.getByRole("region", { name: t.label });

  // Sans modèle à photo, aucun champ photo.
  await expect(picker.getByText(t.photo.add)).toHaveCount(0);
  await picker.getByRole("button", { name: t.change }).click();
  await page
    .getByRole("button", { name: t.names.europeen, exact: true })
    .click();

  await picker
    .getByLabel(t.photo.add)
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: PIXEL });
  await expect(picker.getByRole("img", { name: t.photo.alt })).toBeVisible();
  await expect(picker.getByText(t.photo.change)).toBeVisible();

  const route = `/api/cv/${cvId}/export?format=pdf`;
  const withPhoto = await page.request.get(route);
  expect((await withPhoto.body()).toString("latin1")).toContain(
    "/Subtype /Image",
  );
  expect((await page.request.get(`/api/cv/${cvId}/photo`)).status()).toBe(200);

  await picker.getByRole("button", { name: t.photo.remove }).click();
  await expect(picker.getByRole("img", { name: t.photo.alt })).toHaveCount(0);
  expect((await page.request.get(`/api/cv/${cvId}/photo`)).status()).toBe(404);
  const withoutPhoto = await page.request.get(route);
  expect((await withoutPhoto.body()).toString("latin1")).not.toContain(
    "/Subtype /Image",
  );
});

test("vitrine : un modèle choisi sur l'accueil est donné au CV créé", async ({
  page,
}) => {
  await page.goto("/fr");
  const section = page.getByRole("region", { name: fr.home.templates.title });
  // Page générée à l'avance : le choix ne compte qu'une fois la page interactive.
  await expect(async () => {
    await section.getByLabel(t.countryLabel).selectOption("DE");
    await expect(
      section.getByRole("listitem").first().getByRole("button"),
    ).toHaveAccessibleName(t.names.lebenslauf, { timeout: 1_000 });
  }).toPass();
  await section
    .getByRole("button", { name: t.names.lebenslauf, exact: true })
    .click();
  await expect(page).toHaveURL(/\/fr\/creer$/);

  // Le modèle choisi, même payant, est donné au CV (téléchargement verrouillé sans formule).
  await signUp(page);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mon-cv-30s:brouillon") ?? "{}"),
  );
  expect(stored).toMatchObject({ country: "DE", template: "lebenslauf" });
  await page.evaluate(
    (draft) =>
      localStorage.setItem("mon-cv-30s:brouillon", JSON.stringify(draft)),
    { ...stored, answers: ANSWERS, step: 4 },
  );
  await generate(page);
  await expect(page.getByRole("region", { name: t.label })).toContainText(
    t.names.lebenslauf,
  );
  await expect(
    page.getByRole("button", { name: fr.cvExport.pdfLockedLabel }),
  ).toBeVisible();
});

test("page des modèles : publique, indexée et dans le plan du site", async ({
  page,
  request,
}) => {
  await page.goto("/fr/modeles-cv");
  await expect(
    page.getByRole("heading", { level: 1, name: fr.templatesPage.title }),
  ).toBeVisible();
  await expect(page.getByRole("listitem")).not.toHaveCount(0);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of [
    "/fr/modeles-cv",
    "/en/cv-templates",
    "/de/lebenslauf-vorlagen",
  ]) {
    expect(sitemap).toContain(`${path}</loc>`);
  }
});
