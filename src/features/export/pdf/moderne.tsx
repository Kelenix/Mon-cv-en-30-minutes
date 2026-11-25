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

// « Moderne » : deux colonnes. Colonne de couleur à gauche (photo, coordonnées, compétences,
// langues) sur la première page ; parcours à droite, qui continue sur les pages suivantes.
// Moins lisible par les logiciels de recrutement que les modèles ATS (ADR-050).

const SIDEBAR = "#1e3a5f";
const SIDEBAR_WIDTH = 186;
const SIDEBAR_TEXT = "#e2e8f0";
const ACCENT = "#2563eb";
const MUTED = "#52606d";
const GAP = 28;
const SKILLS_PER_LINE_MAX = 14;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Arimo",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#1f2933",
    paddingTop: 40,
    paddingBottom: 56,
    paddingLeft: SIDEBAR_WIDTH + GAP,
    paddingRight: 40,
  },
  // Fond de la colonne, répété sur chaque page.
  band: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR,
  },
  // Contenu de la colonne : première page seulement.
  sidebar: {
    position: "absolute",
    top: 40,
    left: 22,
    width: SIDEBAR_WIDTH - 44,
    color: SIDEBAR_TEXT,
    fontSize: 9.5,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    objectFit: "cover",
    alignSelf: "center",
    marginBottom: 18,
  },
  sideHeading: {
    marginTop: 14,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: "#64748b",
    fontFamily: "Poppins",
    fontWeight: 600,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#ffffff",
  },
  sideItem: { marginBottom: 2 },
  name: {
    fontFamily: "Poppins",
    fontWeight: 600,
    fontSize: 24,
    lineHeight: 1.3,
    color: SIDEBAR,
  },
  title: { marginTop: 1, fontSize: 12, fontWeight: 700, color: ACCENT },
  heading: {
    marginTop: 18,
    marginBottom: 7,
    fontFamily: "Poppins",
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SIDEBAR,
  },
  item: { marginBottom: 9 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  strong: { flex: 1, paddingRight: 8, fontWeight: 700 },
  muted: { color: MUTED },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <KeepWithFirst heading={<Text style={styles.heading}>{title}</Text>}>
      {children}
    </KeepWithFirst>
  );
}

function SideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View>
      <Text style={styles.sideHeading}>{title}</Text>
      {children}
    </View>
  );
}

export function Moderne({ content, texts, photo }: PdfTemplateProps) {
  const { header } = content;
  const { titles } = texts;
  const contact = [header.email, header.phone, header.city].filter((value) =>
    value?.trim(),
  );
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.band} fixed />
      <View style={styles.sidebar}>
        <Photo photo={photo} style={styles.photo} />
        {contact.map((value) => (
          <Text key={value} style={styles.sideItem}>
            {value}
          </Text>
        ))}
        {content.skills.length > 0 ? (
          <SideSection title={titles.skills}>
            {/* Une par ligne ; en paragraphe au-delà, pour tenir dans la colonne. */}
            {content.skills.length > SKILLS_PER_LINE_MAX ? (
              <Text>{content.skills.join(" · ")}</Text>
            ) : (
              content.skills.map((skill, index) => (
                <Text key={index} style={styles.sideItem}>
                  {skill}
                </Text>
              ))
            )}
          </SideSection>
        ) : null}
        {content.languages.length > 0 ? (
          <SideSection title={titles.languages}>
            {content.languages.map((item) => (
              <Text key={item.id} style={styles.sideItem}>
                {item.level ? `${item.name}: ${item.level}` : item.name}
              </Text>
            ))}
          </SideSection>
        ) : null}
      </View>

      <Text style={styles.name}>{header.fullName}</Text>
      {header.title ? <Text style={styles.title}>{header.title}</Text> : null}

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

      <PageMarks
        texts={texts}
        left={SIDEBAR_WIDTH + GAP}
        right={40}
        color={MUTED}
      />
    </Page>
  );
}
