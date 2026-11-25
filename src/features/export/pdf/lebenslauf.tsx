import type { ReactNode } from "react";
import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { joinFilled, period } from "@/features/cv/content";
import {
  Bullets,
  KeepWithFirst,
  PageMarks,
  Photo,
  type PdfTemplateProps,
} from "./parts";

// « Lebenslauf » : présentation en tableau d'usage en Allemagne, en Autriche et en Suisse.
// Coordonnées en tête, photo à droite, dates dans une colonne fixe, sobre (gris ardoise).

const ACCENT = "#334155";
const MUTED = "#5b6472";
const DATE_WIDTH = 112;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Arimo",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#1e293b",
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
  },
  identity: { flex: 1, paddingRight: 16 },
  name: { fontSize: 24, fontWeight: 700, lineHeight: 1.15, color: ACCENT },
  title: { marginTop: 3, fontSize: 12, fontWeight: 700 },
  contact: { marginTop: 1, color: MUTED },
  photo: { width: 84, height: 106, objectFit: "cover" },
  heading: {
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 2,
    borderBottomWidth: 0.75,
    borderBottomColor: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
    color: ACCENT,
  },
  row: { flexDirection: "row", marginBottom: 8 },
  date: { width: DATE_WIDTH, paddingRight: 12, color: MUTED },
  body: { flex: 1 },
  strong: { fontWeight: 700 },
  muted: { color: MUTED },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <KeepWithFirst heading={<Text style={styles.heading}>{title}</Text>}>
      {children}
    </KeepWithFirst>
  );
}

function Row({ date, children }: { date?: string; children: ReactNode }) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.date}>{date ?? ""}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function Lebenslauf({ content, texts, photo }: PdfTemplateProps) {
  const { header } = content;
  const { titles } = texts;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Text style={styles.name}>{header.fullName}</Text>
          {header.title ? (
            <Text style={styles.title}>{header.title}</Text>
          ) : null}
          <View style={{ marginTop: 6 }}>
            {[header.email, header.phone, header.city]
              .filter((value) => value?.trim())
              .map((value) => (
                <Text key={value} style={styles.contact}>
                  {value}
                </Text>
              ))}
          </View>
        </View>
        <Photo photo={photo} style={styles.photo} />
      </View>

      {content.summary ? (
        <Section title={titles.summary}>
          <Text>{content.summary}</Text>
        </Section>
      ) : null}

      {content.experiences.length > 0 ? (
        <Section title={titles.experiences}>
          {content.experiences.map((item) => (
            <Row key={item.id} date={period(item.startDate, item.endDate)}>
              <Text style={styles.strong}>{item.role}</Text>
              <Text style={styles.muted}>
                {joinFilled([item.company, item.location], ", ")}
              </Text>
              <Bullets items={item.bullets} />
            </Row>
          ))}
        </Section>
      ) : null}

      {content.education.length > 0 ? (
        <Section title={titles.education}>
          {content.education.map((item) => (
            <Row key={item.id} date={item.year}>
              <Text style={styles.strong}>{item.degree}</Text>
              {item.school ? (
                <Text style={styles.muted}>{item.school}</Text>
              ) : null}
              {item.details ? <Text>{item.details}</Text> : null}
            </Row>
          ))}
        </Section>
      ) : null}

      {content.skills.length > 0 ? (
        <Section title={titles.skills}>
          <Row>
            <Text>{content.skills.join(" · ")}</Text>
          </Row>
        </Section>
      ) : null}

      {content.languages.length > 0 ? (
        <Section title={titles.languages}>
          {content.languages.map((item) => (
            <Row key={item.id} date={item.name}>
              <Text>{item.level ?? ""}</Text>
            </Row>
          ))}
        </Section>
      ) : null}

      <PageMarks texts={texts} left={50} right={50} color={MUTED} />
    </Page>
  );
}
