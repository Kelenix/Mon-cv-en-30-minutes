import type { ReactNode } from "react";
import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { joinFilled, period } from "@/features/cv/content";
import {
  Bullets,
  KeepWithFirst,
  languageLabel,
  PageMarks,
  type PdfTemplateProps,
} from "./parts";

// « Élégant » : une colonne (lue par les logiciels de recrutement, H34), police à empattements
// Lora, en-tête centré, intitulés espacés, couleur bordeaux. Sans photo.

const ACCENT = "#7a1f2b";
const MUTED = "#57534e";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Lora",
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#1c1917",
    paddingTop: 46,
    paddingBottom: 58,
    paddingHorizontal: 56,
  },
  header: {
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 0.75,
    borderBottomColor: "#d6d3d1",
  },
  name: {
    fontSize: 25,
    fontWeight: 700,
    letterSpacing: 1,
    lineHeight: 1.15,
    textAlign: "center",
  },
  title: {
    marginTop: 3,
    fontSize: 12.5,
    fontStyle: "italic",
    color: ACCENT,
    textAlign: "center",
  },
  contact: { marginTop: 5, fontSize: 9.5, color: MUTED, textAlign: "center" },
  heading: {
    marginTop: 18,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: ACCENT,
    textAlign: "center",
  },
  headingRule: {
    alignSelf: "center",
    width: 36,
    marginTop: 3,
    marginBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT,
  },
  item: { marginBottom: 9 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  strong: { flex: 1, paddingRight: 10, fontWeight: 700 },
  dates: { fontStyle: "italic", color: MUTED },
  muted: { fontStyle: "italic", color: MUTED },
  centered: { textAlign: "center" },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <KeepWithFirst
      heading={
        <View>
          <Text style={styles.heading}>{title}</Text>
          <View style={styles.headingRule} />
        </View>
      }
    >
      {children}
    </KeepWithFirst>
  );
}

export function Elegant({ content, texts }: PdfTemplateProps) {
  const { header } = content;
  const { titles } = texts;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{header.fullName}</Text>
        {header.title ? <Text style={styles.title}>{header.title}</Text> : null}
        <Text style={styles.contact}>
          {joinFilled([header.email, header.phone, header.city], "   |   ")}
        </Text>
      </View>

      {content.summary ? (
        <Section title={titles.summary}>
          <Text style={styles.centered}>{content.summary}</Text>
        </Section>
      ) : null}

      {content.experiences.length > 0 ? (
        <Section title={titles.experiences}>
          {content.experiences.map((item) => (
            <View key={item.id} style={styles.item} wrap={false}>
              <View style={styles.row}>
                <Text style={styles.strong}>{item.role}</Text>
                <Text style={styles.dates}>
                  {period(item.startDate, item.endDate)}
                </Text>
              </View>
              <Text style={styles.muted}>
                {joinFilled([item.company, item.location], ", ")}
              </Text>
              <Bullets items={item.bullets} color={ACCENT} />
            </View>
          ))}
        </Section>
      ) : null}

      {content.skills.length > 0 ? (
        <Section title={titles.skills}>
          <Text style={styles.centered}>{content.skills.join("  ·  ")}</Text>
        </Section>
      ) : null}

      {content.education.length > 0 ? (
        <Section title={titles.education}>
          {content.education.map((item) => (
            <View key={item.id} style={styles.item} wrap={false}>
              <View style={styles.row}>
                <Text style={styles.strong}>{item.degree}</Text>
                <Text style={styles.dates}>{item.year}</Text>
              </View>
              {item.school ? (
                <Text style={styles.muted}>{item.school}</Text>
              ) : null}
              {item.details ? <Text>{item.details}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {content.languages.length > 0 ? (
        <Section title={titles.languages}>
          <Text style={styles.centered}>
            {content.languages.map(languageLabel).join("  ·  ")}
          </Text>
        </Section>
      ) : null}

      <PageMarks texts={texts} left={56} right={56} color={MUTED} />
    </Page>
  );
}
