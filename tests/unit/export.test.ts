import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";
import type { CvDocumentTexts } from "@/features/cv/document-style";
import type { CvContent } from "@/features/cv/schemas";
import { renderCvDocx } from "@/features/export/cv-docx";
import { renderCvPdf } from "@/features/export/cv-pdf";
import { attachmentHeader, exportFileName } from "@/features/export/file-name";
import { canExportWithoutWatermark } from "@/features/plans/entitlements";

// Exports (US-16, US-17) : le texte extrait automatiquement des fichiers, comme le font les
// logiciels de recrutement, restitue chaque rubrique dans l'ordre, sans perte (H34).

const WATERMARK = "Créé avec Mon CV en 30 Secondes";
const TEXTS: CvDocumentTexts = {
  language: "fr",
  titles: {
    summary: "Profil",
    experiences: "Expérience professionnelle",
    skills: "Compétences",
    education: "Formation",
    languages: "Langues",
  },
};

const CONTENT: CvContent = {
  header: {
    fullName: "Łukasz Dvořák",
    title: "Développeur TypeScript",
    email: "lukasz@exemple.test",
    city: "Lyon",
  },
  summary: "Développeur web avec 6 ans d'expérience en applications métier.",
  experiences: [
    {
      id: "e1",
      role: "Développeur full-stack",
      company: "Studio Lumière",
      location: "Lyon",
      startDate: "2021",
      endDate: "Aujourd'hui",
      bullets: [
        "Refonte d'une application de facturation en TypeScript et PostgreSQL",
        "Accompagnement de deux développeurs juniors",
      ],
    },
  ],
  skills: ["TypeScript", "React", "PostgreSQL"],
  education: [
    {
      id: "f1",
      degree: "Master Informatique",
      school: "Université Lyon 1",
      year: "2018",
    },
  ],
  languages: [{ id: "l1", name: "Anglais", level: "courant" }],
};

const ORDER = [
  "Łukasz Dvořák",
  "Développeur TypeScript",
  "PROFIL",
  "EXPÉRIENCE PROFESSIONNELLE",
  "Refonte d'une application de facturation en TypeScript et PostgreSQL",
  "COMPÉTENCES",
  "FORMATION",
  "Master Informatique — Université Lyon 1",
  "LANGUES",
  "Anglais (courant)",
];

function expectInOrder(text: string, parts: string[]) {
  const flat = text.replace(/\s+/g, " ");
  let position = -1;
  for (const part of parts) {
    const index = flat.indexOf(part, position + 1);
    expect(index, `« ${part} » absent ou mal placé`).toBeGreaterThan(position);
    position = index;
  }
}

async function pdfPages(buffer: Buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return text;
}

describe("PDF", () => {
  it("restitue chaque rubrique dans l'ordre, sans mot coupé ni caractère perdu", async () => {
    const [page] = await pdfPages(await renderCvPdf(CONTENT, TEXTS));
    expectInOrder(page, ORDER);
    expect(page).not.toContain(WATERMARK);
  });

  it("porte le filigrane sur chaque page quand il est demandé (US-16 c.2)", async () => {
    const long: CvContent = {
      ...CONTENT,
      experiences: Array.from({ length: 12 }, (_, index) => ({
        ...CONTENT.experiences[0],
        id: `e${index}`,
        bullets: Array.from({ length: 4 }, () =>
          "Mission détaillée ".repeat(8),
        ),
      })),
    };
    const pages = await pdfPages(
      await renderCvPdf(long, { ...TEXTS, watermark: WATERMARK }),
    );
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) expect(page).toContain(WATERMARK);
  });
});

describe("DOCX", () => {
  it("garde les rubriques en titres Word, les listes et l'ordre (US-17 c.2)", async () => {
    const buffer = await renderCvDocx(CONTENT, TEXTS);
    const { value: html } = await mammoth.convertToHtml({ buffer });
    expect(html).toContain("<h1>Expérience professionnelle</h1>");
    expect(html).toContain(
      "<ul><li>Refonte d'une application de facturation en TypeScript et PostgreSQL</li>",
    );

    const { value: text } = await mammoth.extractRawText({ buffer });
    expectInOrder(
      text,
      ORDER.map((part) => (part === part.toUpperCase() ? titleOf(part) : part)),
    );
  });
});

/** Dans le DOCX, la mise en capitales est un style : le texte garde sa casse d'origine. */
function titleOf(upper: string) {
  return Object.values(TEXTS.titles).find(
    (title) => title.toUpperCase() === upper,
  )!;
}

describe("nom du fichier (US-16 c.3)", () => {
  it("s'appelle CV-Prénom-Nom, accents compris", () => {
    expect(exportFileName("Amélie  Durand-Roy", "pdf")).toBe(
      "CV-Amélie-Durand-Roy.pdf",
    );
    expect(exportFileName("Seán O'Brien", "docx")).toBe("CV-Seán-O'Brien.docx");
    expect(exportFileName("", "pdf")).toBe("CV.pdf");
  });

  it("est transmis avec une variante sans accent", () => {
    expect(attachmentHeader("CV-Amélie-O'Brien.pdf")).toBe(
      "attachment; filename=\"CV-Amelie-O'Brien.pdf\"; filename*=UTF-8''CV-Am%C3%A9lie-O%27Brien.pdf",
    );
  });
});

describe("droits d'export (US-17)", () => {
  it("sans abonnement ni CV Pro : filigrane, pas de DOCX", () => {
    expect(canExportWithoutWatermark(null, false)).toBe(false);
  });

  it("avec CV Pro ou n'importe quel abonnement : sans filigrane, DOCX", () => {
    expect(canExportWithoutWatermark(null, true)).toBe(true);
    for (const plan of ["essential", "pro", "premium"] as const) {
      expect(canExportWithoutWatermark(plan, false)).toBe(true);
    }
  });
});
