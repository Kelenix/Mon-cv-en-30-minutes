import type { ComponentType } from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { titleLine } from "@/features/cv/content";
import type { CvDocumentTexts } from "@/features/cv/document-style";
import type { CvContent } from "@/features/cv/schemas";
import { type CvTemplate, DEFAULT_TEMPLATE } from "@/features/cv/templates";
import "./pdf/fonts";
import { AtsClassique } from "./pdf/ats-classique";
import { AtsModerne } from "./pdf/ats-moderne";
import { Elegant } from "./pdf/elegant";
import { Europeen } from "./pdf/europeen";
import { Lebenslauf } from "./pdf/lebenslauf";
import { Moderne } from "./pdf/moderne";
import type { PdfTemplateProps } from "./pdf/parts";

// CV en PDF (US-16, US-17, Inc-15) : un rendu par modèle, texte réel et sélectionnable, polices
// intégrées. Les modèles ATS restent sur une colonne (H34, ADR-050).

const TEMPLATES: Record<CvTemplate, ComponentType<PdfTemplateProps>> = {
  "ats-classique": AtsClassique,
  europeen: Europeen,
  "ats-moderne": AtsModerne,
  lebenslauf: Lebenslauf,
  moderne: Moderne,
  elegant: Elegant,
};

export function renderCvPdf(
  content: CvContent,
  texts: CvDocumentTexts,
  {
    template = DEFAULT_TEMPLATE,
    photo,
  }: { template?: CvTemplate; photo?: Buffer } = {},
) {
  const Template = TEMPLATES[template];
  return renderToBuffer(
    <Document
      title={titleLine(content.header.fullName, content.header.title)}
      author={content.header.fullName}
      language={texts.language}
    >
      <Template content={content} texts={texts} photo={photo} />
    </Document>,
  );
}
