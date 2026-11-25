import { createElement as h } from "react";
import { Document, Page, renderToBuffer, Text } from "@react-pdf/renderer";
import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./support/accounts";

// Rubrique « Conseils » et test ATS gratuit (ADR-052) : pages publiques, utiles au
// référencement, qui mènent à la création du CV.

test("conseils : sommaire, article avec exemples copiables et données structurées", async ({
  page,
}) => {
  await page.goto("/fr/conseils");
  await expect(
    page.getByRole("heading", { level: 1, name: /^Conseils pour ton CV/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "CV par pays" }),
  ).toBeVisible();

  await page
    .getByRole("link", {
      name: /^Lettre de motivation pour un stage de 3e/,
    })
    .click();
  await expect(page).toHaveURL(/\/fr\/conseils\/lettre-motivation-stage-3e$/);
  await expect(page).toHaveTitle(
    "Lettre de motivation stage de 3e : 3 exemples à adapter",
  );
  await expect(
    page.getByText("Exemple 1 : stage dans une boulangerie"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copier l'exemple" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Créer mon CV gratuitement" }).first(),
  ).toHaveAttribute("href", "/fr/creer");

  const data = JSON.parse(
    (await page
      .locator('script[type="application/ld+json"]')
      .last()
      .textContent()) ?? "{}",
  ) as { "@graph": { "@type": string }[] };
  expect(data["@graph"].map((item) => item["@type"])).toEqual([
    "Article",
    "FAQPage",
    "BreadcrumbList",
  ]);
  await expectNoAccessibilityViolations(page);
});

test("conseils : une langue sans article ramène à l'accueil", async ({
  page,
}) => {
  await page.goto("/en/guides/lettre-motivation-stage-3e");
  await expect(page).toHaveURL(/\/en$/);
});

test("test ATS : note sur 100 pour un CV en PDF, refus d'un autre fichier", async ({
  page,
}) => {
  const pdf = await renderToBuffer(
    h(
      Document,
      null,
      h(
        Page,
        { size: "A4", style: { padding: 40 } },
        ...[
          "Awa Diallo",
          "awa.diallo@email.fr · 06 12 34 56 78",
          "Expérience professionnelle",
          "Comptable, Cabinet Martin, Lyon, 2020 - 2026",
          "Tenue de la comptabilité de 45 clients ; clôtures 20 % plus rapides.",
          "Formation",
          "BTS Comptabilité et gestion, 2018",
          "Compétences",
          "Sage, SAP, Excel, paie, fiscalité.",
          ...Array.from(
            { length: 12 },
            () =>
              "Suivi de dossiers clients variés, en autonomie comme en équipe, avec rigueur.",
          ),
        ].map((line, index) => h(Text, { key: index }, line)),
      ),
    ),
  );

  await page.goto("/fr/test-cv-ats");
  const input = page.locator('input[type="file"]');
  await expect(input).toBeEnabled();
  await input.setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  const result = page.getByRole("region", { name: "Score ATS" });
  await expect(result.getByText(/^\d{1,3}\/100$/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(result.getByText("Adresse e-mail trouvée.")).toBeVisible();
  await expect(
    result.getByText("Rubrique « Expérience » trouvée."),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await input.setInputFiles({
    name: "cv.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Awa Diallo"),
  });
  await expect(page.getByRole("alert")).toHaveText(
    "Ce fichier n'est pas un PDF. Enregistre ton CV au format PDF, puis réessaie.",
  );
});
