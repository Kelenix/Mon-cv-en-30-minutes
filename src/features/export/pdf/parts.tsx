import { Children, type ComponentProps, type ReactNode } from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import type { CvDocumentTexts } from "@/features/cv/document-style";
import type { CvContent } from "@/features/cv/schemas";

// Éléments communs aux modèles PDF (Inc-15) : texte réel et sélectionnable, rubriques aux
// intitulés standard dans la langue du CV.

export type PdfTemplateProps = {
  content: CvContent;
  texts: CvDocumentTexts;
  /** Photo du candidat (JPEG), pour les modèles qui en prévoient une. */
  photo?: Buffer;
};

export type PdfStyle = ComponentProps<typeof View>["style"];

/**
 * Un intitulé n'est jamais laissé seul en bas de page : il reste avec le premier élément de sa
 * rubrique, qui ne se coupe pas (une simple marge d'avance ne suffit pas).
 */
export function KeepWithFirst({
  heading,
  children,
}: {
  heading: ReactNode;
  children: ReactNode;
}) {
  const [first, ...rest] = Children.toArray(children);
  return (
    <View>
      <View wrap={false}>
        {heading}
        {first}
      </View>
      {rest}
    </View>
  );
}

/** Liste à puces « • », sans tiret (ADR-049). */
export function Bullets({
  items,
  color,
  indent = 12,
}: {
  items: string[];
  color?: string;
  indent?: number;
}) {
  return items.map((bullet, index) => (
    <View key={index} style={{ flexDirection: "row", marginTop: 2 }}>
      <Text style={{ width: indent, color }}>•</Text>
      <Text style={{ flex: 1 }}>{bullet}</Text>
    </View>
  ));
}

export function Photo({ photo, style }: { photo?: Buffer; style: PdfStyle }) {
  return photo ? (
    // eslint-disable-next-line jsx-a11y/alt-text -- image d'un PDF, sans attribut alt
    <Image src={{ data: photo, format: "jpg" }} style={style} />
  ) : null;
}

/** Langue et niveau : « Anglais (courant) ». */
export function languageLabel(item: CvContent["languages"][number]) {
  return item.level ? `${item.name} (${item.level})` : item.name;
}

/**
 * Filigrane (US-16 c.2) : une ligne de texte séparée du contenu, sur chaque page. Mention
 * « Aperçu » en travers des pages d'un modèle payant essayé sans droit (ADR-050).
 */
export function PageMarks({
  texts,
  left,
  right,
  color,
}: {
  texts: CvDocumentTexts;
  left: number;
  right: number;
  color: string;
}) {
  return (
    <>
      {texts.preview ? (
        <Text
          fixed
          style={{
            position: "absolute",
            top: 360,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 96,
            fontWeight: 700,
            color: "#94a3b8",
            opacity: 0.22,
            transform: "rotate(-30deg)",
          }}
        >
          {texts.preview}
        </Text>
      ) : null}
      {texts.watermark ? (
        <Text
          fixed
          style={{
            position: "absolute",
            bottom: 24,
            left,
            right,
            textAlign: "center",
            fontSize: 8,
            color,
          }}
        >
          {texts.watermark}
        </Text>
      ) : null}
    </>
  );
}
