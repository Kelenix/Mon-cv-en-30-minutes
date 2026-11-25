import type { ReactNode } from "react";
import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { joinFilled, period, titleLine } from "@/features/cv/content";
import { CV_COLORS } from "@/features/cv/document-style";
import {
  Bullets,
  KeepWithFirst,
  languageLabel,
  PageMarks,
  type PdfTemplateProps,
} from "./parts";

// « ATS classique » (gratuit) : une colonne, intitulés soulignés, aucune photo (H34). Le modèle
// d'origine du site.

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
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <KeepWithFirst heading={<Text style={styles.heading}>{title}</Text>}>
      {children}
    </KeepWithFirst>
  );
}

export function AtsClassique({ content, texts }: PdfTemplateProps) {
  const { header } = content;
  const { titles } = texts;
  return (
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
                {titleLine(item.role, item.company)}
              </Text>
              <Text style={styles.muted}>
                {joinFilled(
                  [item.location, period(item.startDate, item.endDate)],
                  " · ",
                )}
              </Text>
              <Bullets items={item.bullets} />
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
                {titleLine(item.degree, item.school)}
              </Text>
              {item.year ? <Text style={styles.muted}>{item.year}</Text> : null}
              {item.details ? <Text>{item.details}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {content.languages.length > 0 ? (
        <Section title={titles.languages}>
          {content.languages.map((item) => (
            <Text key={item.id}>{languageLabel(item)}</Text>
          ))}
        </Section>
      ) : null}

      <PageMarks texts={texts} left={50} right={50} color={CV_COLORS.muted} />
    </Page>
  );
}
