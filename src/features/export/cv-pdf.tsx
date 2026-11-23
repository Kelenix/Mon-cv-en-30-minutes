import path from "node:path";
import type { ReactNode } from "react";
import {
  Document,
  Font,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { joinFilled, period } from "@/features/cv/content";
import { CV_COLORS, type CvDocumentTexts } from "@/features/cv/document-style";
import type { CvContent } from "@/features/cv/schemas";

// CV en PDF (US-16, US-17) : même contenu et même ordre que l'aperçu, texte réel et
// sélectionnable, une colonne (H34). Police Arimo (licence libre, mêmes dimensions qu'Arial)
// intégrée : tous les caractères des langues européennes s'affichent.

const FONT_DIR = path.join(
  process.cwd(),
  "node_modules/@expo-google-fonts/arimo",
);

Font.register({
  family: "Arimo",
  fonts: [
    { src: path.join(FONT_DIR, "400Regular/Arimo_400Regular.ttf") },
    {
      src: path.join(FONT_DIR, "700Bold/Arimo_700Bold.ttf"),
      fontWeight: 700,
    },
  ],
});
// Aucune césure : un mot-clé coupé ne serait plus reconnu par les logiciels de recrutement.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: "Arimo",
    fontSize: 10.5,
    lineHeight: 1.4,
    color: CV_COLORS.text,
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 50,
  },
  name: { fontSize: 22, fontWeight: 700, lineHeight: 1.2 },
  title: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: 700,
    color: CV_COLORS.accent,
  },
  contact: { marginTop: 6 },
  heading: {
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 1.5,
    borderBottomColor: CV_COLORS.accent,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: CV_COLORS.accent,
  },
  item: { marginBottom: 8 },
  strong: { fontWeight: 700 },
  muted: { color: CV_COLORS.muted },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletMark: { width: 12 },
  bulletText: { flex: 1 },
  watermark: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: CV_COLORS.muted,
  },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      {/* Un intitulé n'est jamais laissé seul en bas de page. */}
      <Text style={styles.heading} minPresenceAhead={40}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function CvPdf({
  content,
  texts,
}: {
  content: CvContent;
  texts: CvDocumentTexts;
}) {
  const { header } = content;
  const { titles } = texts;

  return (
    <Document
      title={joinFilled([header.fullName, header.title], " — ")}
      author={header.fullName}
      language={texts.language}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{header.fullName}</Text>
        {header.title ? <Text style={styles.title}>{header.title}</Text> : null}
        <Text style={styles.contact}>
          {joinFilled([header.email, header.phone, header.city], " · ")}
        </Text>

        {content.summary ? (
          <Section title={titles.summary}>
            <Text>{content.summary}</Text>
          </Section>
        ) : null}

        {content.experiences.length > 0 ? (
          <Section title={titles.experiences}>
            {content.experiences.map((item) => (
              <View key={item.id} style={styles.item} wrap={false}>
                <Text style={styles.strong}>
                  {joinFilled([item.role, item.company], " — ")}
                </Text>
                <Text style={styles.muted}>
                  {joinFilled(
                    [item.location, period(item.startDate, item.endDate)],
                    " · ",
                  )}
                </Text>
                {item.bullets.map((bullet, index) => (
                  <View key={index} style={styles.bullet}>
                    <Text style={styles.bulletMark}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        ) : null}

        {content.skills.length > 0 ? (
          <Section title={titles.skills}>
            <Text>{content.skills.join(" · ")}</Text>
          </Section>
        ) : null}

        {content.education.length > 0 ? (
          <Section title={titles.education}>
            {content.education.map((item) => (
              <View key={item.id} style={styles.item} wrap={false}>
                <Text style={styles.strong}>
                  {joinFilled([item.degree, item.school], " — ")}
                </Text>
                {item.year ? (
                  <Text style={styles.muted}>{item.year}</Text>
                ) : null}
                {item.details ? <Text>{item.details}</Text> : null}
              </View>
            ))}
          </Section>
        ) : null}

        {content.languages.length > 0 ? (
          <Section title={titles.languages}>
            {content.languages.map((item) => (
              <Text key={item.id}>
                {item.level ? `${item.name} (${item.level})` : item.name}
              </Text>
            ))}
          </Section>
        ) : null}

        {/* Filigrane (US-16 c.2) : une ligne de texte séparée du contenu, sur chaque page. */}
        {texts.watermark ? (
          <Text style={styles.watermark} fixed>
            {texts.watermark}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}

export function renderCvPdf(content: CvContent, texts: CvDocumentTexts) {
  return renderToBuffer(<CvPdf content={content} texts={texts} />);
}
