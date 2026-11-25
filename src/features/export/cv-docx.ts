import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { joinFilled, period, titleLine } from "@/features/cv/content";
import {
  CV_COLORS,
  CV_FONT,
  type CvDocumentTexts,
} from "@/features/cv/document-style";
import type { CvContent } from "@/features/cv/schemas";

// CV en DOCX (US-17) : styles Word standard (« Titre » pour le nom, « Titre 1 » pour les
// rubriques), vraies listes à puces, coordonnées dans le corps du document (H34). Tailles en
// demi-points, espacements en vingtièmes de point.

const color = (hex: string) => hex.slice(1).toUpperCase();

function heading(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
}

function line(text: string, options: { bold?: boolean; muted?: boolean } = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: options.bold,
        color: options.muted ? color(CV_COLORS.muted) : undefined,
      }),
    ],
  });
}

function bullet(text: string) {
  return new Paragraph({ text, bullet: { level: 0 } });
}

export function renderCvDocx(content: CvContent, texts: CvDocumentTexts) {
  const { header } = content;
  const { titles } = texts;
  const children: Paragraph[] = [
    new Paragraph({ text: header.fullName, heading: HeadingLevel.TITLE }),
  ];

  if (header.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: header.title,
            bold: true,
            size: 26,
            color: color(CV_COLORS.accent),
          }),
        ],
      }),
    );
  }
  children.push(
    line(joinFilled([header.email, header.phone, header.city], " · ")),
  );

  if (content.summary) {
    children.push(heading(titles.summary), line(content.summary));
  }
  if (content.experiences.length > 0) {
    children.push(heading(titles.experiences));
    for (const item of content.experiences) {
      children.push(line(titleLine(item.role, item.company), { bold: true }));
      const meta = joinFilled(
        [item.location, period(item.startDate, item.endDate)],
        " · ",
      );
      if (meta) children.push(line(meta, { muted: true }));
      children.push(...item.bullets.map(bullet));
    }
  }
  if (content.skills.length > 0) {
    children.push(heading(titles.skills), line(content.skills.join(" · ")));
  }
  if (content.education.length > 0) {
    children.push(heading(titles.education));
    for (const item of content.education) {
      children.push(line(titleLine(item.degree, item.school), { bold: true }));
      if (item.year) children.push(line(item.year, { muted: true }));
      if (item.details) children.push(line(item.details));
    }
  }
  if (content.languages.length > 0) {
    children.push(
      heading(titles.languages),
      ...content.languages.map((item) =>
        line(item.level ? `${item.name} (${item.level})` : item.name),
      ),
    );
  }

  const document = new Document({
    title: titleLine(header.fullName, header.title),
    creator: header.fullName,
    styles: {
      default: {
        document: {
          run: { font: CV_FONT, size: 21, color: color(CV_COLORS.text) },
          paragraph: { spacing: { after: 60, line: 276 } },
        },
        title: {
          run: {
            font: CV_FONT,
            size: 44,
            bold: true,
            color: color(CV_COLORS.text),
          },
          paragraph: { spacing: { after: 60 } },
        },
        heading1: {
          run: {
            font: CV_FONT,
            size: 22,
            bold: true,
            allCaps: true,
            color: color(CV_COLORS.accent),
          },
          paragraph: {
            spacing: { before: 320, after: 120 },
            keepNext: true,
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 12,
                color: color(CV_COLORS.accent),
                space: 2,
              },
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}
