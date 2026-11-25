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

// « Format européen » (gratuit) : présentation inspirée de l'usage européen, chaque rubrique sous
// un intitulé suivi d'un filet, dates dans une colonne à gauche, photo facultative en tête.

const ACCENT = "#1e40af";
const MUTED = "#4b5563";
const LABEL_WIDTH = 118;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Arimo",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#111827",
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  photo: {
    width: 78,
    height: 98,
    marginRight: 18,
    objectFit: "cover",
    borderRadius: 3,
  },
  name: { fontSize: 22, fontWeight: 700, lineHeight: 1.2 },
  title: { marginTop: 2, fontSize: 12, color: ACCENT },
  contact: { marginTop: 1, color: MUTED },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 7,
  },
  heading: {
    paddingRight: 10,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: ACCENT,
  },
  rule: { flex: 1, borderBottomWidth: 1, borderBottomColor: ACCENT },
  row: { flexDirection: "row", marginBottom: 8 },
  label: {
    width: LABEL_WIDTH,
    paddingRight: 12,
    textAlign: "right",
    color: MUTED,
  },
  body: { flex: 1 },
  strong: { fontWeight: 700 },
  muted: { color: MUTED },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <KeepWithFirst
      heading={
        <View style={styles.headingRow}>
          <Text style={styles.heading}>{title}</Text>
          <View style={styles.rule} />
        </View>
      }
    >
      {children}
    </KeepWithFirst>
  );
}

/** Ligne de rubrique : repère à gauche (dates, langue), détails à droite. */
function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.label}>{label ?? ""}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function Europeen({ content, texts, photo }: PdfTemplateProps) {
  const { header } = content;
  const { titles } = texts;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Photo photo={photo} style={styles.photo} />
        <View style={styles.body}>
          <Text style={styles.name}>{header.fullName}</Text>
          {header.title ? (
            <Text style={styles.title}>{header.title}</Text>
          ) : null}
          {[header.email, header.phone, header.city]
            .filter((value) => value?.trim())
            .map((value) => (
              <Text key={value} style={styles.contact}>
                {value}
              </Text>
            ))}
        </View>
      </View>

      {content.summary ? (
        <Section title={titles.summary}>
          <Row>
            <Text>{content.summary}</Text>
          </Row>
        </Section>
      ) : null}

      {content.experiences.length > 0 ? (
        <Section title={titles.experiences}>
          {content.experiences.map((item) => (
            <Row key={item.id} label={period(item.startDate, item.endDate)}>
              <Text style={styles.strong}>{item.role}</Text>
              <Text style={styles.muted}>
                {joinFilled([item.company, item.location], ", ")}
              </Text>
              <Bullets items={item.bullets} color={ACCENT} />
            </Row>
          ))}
        </Section>
      ) : null}

      {content.education.length > 0 ? (
        <Section title={titles.education}>
          {content.education.map((item) => (
            <Row key={item.id} label={item.year}>
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
            <Row key={item.id} label={item.name}>
              <Text>{item.level ?? ""}</Text>
            </Row>
          ))}
        </Section>
      ) : null}

      <PageMarks texts={texts} left={44} right={44} color={MUTED} />
    </Page>
  );
}
