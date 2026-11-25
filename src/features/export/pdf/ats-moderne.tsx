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

// « ATS moderne » : une colonne lue sans perte par les logiciels de recrutement (H34), titre en
// Poppins, filet d'accent, dates alignées à droite. Sans photo.

const ACCENT = "#0f766e";
const MUTED = "#52606d";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Arimo",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#1f2933",
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },
  header: { borderLeftWidth: 4, borderLeftColor: ACCENT, paddingLeft: 12 },
  name: {
    fontFamily: "Poppins",
    fontWeight: 600,
    fontSize: 24,
    lineHeight: 1.3,
    color: "#102a43",
  },
  title: { marginTop: 1, fontSize: 12, fontWeight: 700, color: ACCENT },
  contact: { marginTop: 5, color: MUTED },
  heading: {
    marginTop: 18,
    marginBottom: 7,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: "#bcccdc",
    fontFamily: "Poppins",
    fontWeight: 600,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: ACCENT,
  },
  item: { marginBottom: 9 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  strong: { flex: 1, paddingRight: 10, fontWeight: 700 },
  muted: { color: MUTED },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <KeepWithFirst heading={<Text style={styles.heading}>{title}</Text>}>
      {children}
    </KeepWithFirst>
  );
}

export function AtsModerne({ content, texts }: PdfTemplateProps) {
  const { header } = content;
  const { titles } = texts;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{header.fullName}</Text>
        {header.title ? <Text style={styles.title}>{header.title}</Text> : null}
        <Text style={styles.contact}>
          {joinFilled([header.email, header.phone, header.city], "  ·  ")}
        </Text>
      </View>

      {content.summary ? (
        <Section title={titles.summary}>
          <Text>{content.summary}</Text>
        </Section>
      ) : null}

      {content.experiences.length > 0 ? (
        <Section title={titles.experiences}>
          {content.experiences.map((item) => (
            <View key={item.id} style={styles.item} wrap={false}>
              <View style={styles.row}>
                <Text style={styles.strong}>{item.role}</Text>
                <Text style={styles.muted}>
                  {period(item.startDate, item.endDate)}
                </Text>
              </View>
              <Text style={styles.muted}>
                {joinFilled([item.company, item.location], " · ")}
              </Text>
              <Bullets items={item.bullets} color={ACCENT} />
            </View>
          ))}
        </Section>
      ) : null}

      {content.skills.length > 0 ? (
        <Section title={titles.skills}>
          <Text>{content.skills.join("  ·  ")}</Text>
        </Section>
      ) : null}

      {content.education.length > 0 ? (
        <Section title={titles.education}>
          {content.education.map((item) => (
            <View key={item.id} style={styles.item} wrap={false}>
              <View style={styles.row}>
                <Text style={styles.strong}>{item.degree}</Text>
                <Text style={styles.muted}>{item.year}</Text>
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
          <Text>{content.languages.map(languageLabel).join("  ·  ")}</Text>
        </Section>
      ) : null}

      <PageMarks texts={texts} left={48} right={48} color={MUTED} />
    </Page>
  );
}
