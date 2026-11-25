import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { renderPageAsImage } from "unpdf";
import { it } from "vitest";
import type { CvContent } from "@/features/cv/schemas";
import { CV_TEMPLATES } from "@/features/cv/templates";
import { renderCvPdf } from "@/features/export/cv-pdf";
import { routing } from "@/i18n/routing";

// Miniatures des modèles de CV (Inc-15) : `npm run templates:thumbnails`, à relancer après une
// modification d'un modèle PDF. Un CV de démonstration par langue, rendu avec chaque modèle, puis
// la première page en WebP (600 × 848) dans public/cv-templates/<langue>/<modèle>.webp.

const OUT_DIR = path.join(process.cwd(), "public/cv-templates");
const WIDTH = 600;

type Demo = {
  sections: Record<
    "summary" | "experiences" | "skills" | "education" | "languages",
    string
  >;
  content: CvContent;
};

const job = (
  id: string,
  role: string,
  company: string,
  location: string,
  startDate: string,
  endDate: string,
  bullets: string[],
) => ({ id, role, company, location, startDate, endDate, bullets });

const DEMOS: Record<(typeof routing.locales)[number], Demo> = {
  fr: {
    sections: {
      summary: "Profil",
      experiences: "Expérience professionnelle",
      skills: "Compétences",
      education: "Formation",
      languages: "Langues",
    },
    content: {
      header: {
        fullName: "Camille Moreau",
        title: "Responsable marketing digital",
        email: "camille.moreau@exemple.fr",
        phone: "+33 6 12 34 56 78",
        city: "Lyon",
      },
      summary:
        "Responsable marketing avec 8 ans d'expérience en acquisition et en contenu. Pilotage de campagnes multicanales et d'une équipe de quatre personnes.",
      experiences: [
        job(
          "e1",
          "Responsable marketing digital",
          "Maison Lumière",
          "Lyon",
          "2021",
          "Aujourd'hui",
          [
            "Pilotage d'un budget annuel de 600 000 € en publicité en ligne",
            "Encadrement d'une équipe de quatre personnes",
            "Hausse de 40 % des ventes en ligne en deux ans",
          ],
        ),
        job(
          "e2",
          "Chargée de marketing",
          "Studio Nova",
          "Paris",
          "2017",
          "2021",
          [
            "Lancement de la boutique en ligne et de la lettre d'information",
            "Campagnes saisonnières avec l'équipe produit",
          ],
        ),
      ],
      skills: ["Google Ads", "SEO", "Meta Ads", "Google Analytics", "Emailing"],
      education: [
        {
          id: "f1",
          degree: "Master Marketing digital",
          school: "IAE Lyon",
          year: "2015",
        },
      ],
      languages: [
        { id: "l1", name: "Anglais", level: "courant" },
        { id: "l2", name: "Espagnol", level: "intermédiaire" },
      ],
    },
  },
  en: {
    sections: {
      summary: "Profile",
      experiences: "Work experience",
      skills: "Skills",
      education: "Education",
      languages: "Languages",
    },
    content: {
      header: {
        fullName: "Emma Clarke",
        title: "Digital Marketing Manager",
        email: "emma.clarke@example.com",
        phone: "+44 7700 900123",
        city: "Manchester",
      },
      summary:
        "Marketing manager with 8 years of experience in acquisition and content. Leads multichannel campaigns and a team of four.",
      experiences: [
        job(
          "e1",
          "Digital Marketing Manager",
          "Brightline",
          "Manchester",
          "2021",
          "Present",
          [
            "Managed a £500,000 annual online advertising budget",
            "Led a team of four marketers",
            "Grew online sales by 40% in two years",
          ],
        ),
        job(
          "e2",
          "Marketing Executive",
          "Nova Studio",
          "London",
          "2017",
          "2021",
          [
            "Launched the online shop and the newsletter",
            "Ran seasonal campaigns with the product team",
          ],
        ),
      ],
      skills: [
        "Google Ads",
        "SEO",
        "Meta Ads",
        "Google Analytics",
        "Email marketing",
      ],
      education: [
        {
          id: "f1",
          degree: "MSc Digital Marketing",
          school: "University of Leeds",
          year: "2015",
        },
      ],
      languages: [
        { id: "l1", name: "French", level: "fluent" },
        { id: "l2", name: "Spanish", level: "intermediate" },
      ],
    },
  },
  it: {
    sections: {
      summary: "Profilo",
      experiences: "Esperienza professionale",
      skills: "Competenze",
      education: "Formazione",
      languages: "Lingue",
    },
    content: {
      header: {
        fullName: "Giulia Ferri",
        title: "Responsabile marketing digitale",
        email: "giulia.ferri@esempio.it",
        phone: "+39 333 123 4567",
        city: "Milano",
      },
      summary:
        "Responsabile marketing con 8 anni di esperienza in acquisizione e contenuti. Gestisce campagne multicanale e un team di quattro persone.",
      experiences: [
        job(
          "e1",
          "Responsabile marketing digitale",
          "Luce Group",
          "Milano",
          "2021",
          "Oggi",
          [
            "Gestione di un budget annuale di 600.000 € in pubblicità online",
            "Coordinamento di un team di quattro persone",
            "Vendite online aumentate del 40 % in due anni",
          ],
        ),
        job(
          "e2",
          "Addetta marketing",
          "Studio Nova",
          "Torino",
          "2017",
          "2021",
          [
            "Lancio del negozio online e della newsletter",
            "Campagne stagionali con il team prodotto",
          ],
        ),
      ],
      skills: [
        "Google Ads",
        "SEO",
        "Meta Ads",
        "Google Analytics",
        "Email marketing",
      ],
      education: [
        {
          id: "f1",
          degree: "Laurea magistrale in Marketing",
          school: "Università Bocconi",
          year: "2015",
        },
      ],
      languages: [
        { id: "l1", name: "Inglese", level: "C1" },
        { id: "l2", name: "Francese", level: "B2" },
      ],
    },
  },
  es: {
    sections: {
      summary: "Perfil",
      experiences: "Experiencia profesional",
      skills: "Competencias",
      education: "Formación",
      languages: "Idiomas",
    },
    content: {
      header: {
        fullName: "Lucía Romero",
        title: "Responsable de marketing digital",
        email: "lucia.romero@ejemplo.es",
        phone: "+34 612 345 678",
        city: "Madrid",
      },
      summary:
        "Responsable de marketing con 8 años de experiencia en captación y contenidos. Dirige campañas multicanal y un equipo de cuatro personas.",
      experiences: [
        job(
          "e1",
          "Responsable de marketing digital",
          "Grupo Luz",
          "Madrid",
          "2021",
          "Actualidad",
          [
            "Gestión de un presupuesto anual de 600.000 € en publicidad en línea",
            "Dirección de un equipo de cuatro personas",
            "Aumento del 40 % de las ventas en línea en dos años",
          ],
        ),
        job(
          "e2",
          "Técnica de marketing",
          "Estudio Nova",
          "Valencia",
          "2017",
          "2021",
          [
            "Lanzamiento de la tienda en línea y del boletín",
            "Campañas de temporada con el equipo de producto",
          ],
        ),
      ],
      skills: [
        "Google Ads",
        "SEO",
        "Meta Ads",
        "Google Analytics",
        "Email marketing",
      ],
      education: [
        {
          id: "f1",
          degree: "Máster en Marketing Digital",
          school: "Universidad Complutense",
          year: "2015",
        },
      ],
      languages: [
        { id: "l1", name: "Inglés", level: "C1" },
        { id: "l2", name: "Francés", level: "B2" },
      ],
    },
  },
  de: {
    sections: {
      summary: "Profil",
      experiences: "Berufserfahrung",
      skills: "Kenntnisse",
      education: "Ausbildung",
      languages: "Sprachen",
    },
    content: {
      header: {
        fullName: "Lena Hoffmann",
        title: "Leiterin Digital Marketing",
        email: "lena.hoffmann@beispiel.de",
        phone: "+49 151 2345 6789",
        city: "Hamburg",
      },
      summary:
        "Marketingleiterin mit 8 Jahren Erfahrung in Kundengewinnung und Content. Steuert kanalübergreifende Kampagnen und ein Team von vier Personen.",
      experiences: [
        job(
          "e1",
          "Leiterin Digital Marketing",
          "Lichtwerk GmbH",
          "Hamburg",
          "2021",
          "heute",
          [
            "Verantwortung für ein Jahresbudget von 600.000 € für Online-Werbung",
            "Führung eines Teams von vier Personen",
            "Steigerung des Online-Umsatzes um 40 % in zwei Jahren",
          ],
        ),
        job(
          "e2",
          "Marketing-Referentin",
          "Studio Nova",
          "Berlin",
          "2017",
          "2021",
          [
            "Aufbau des Onlineshops und des Newsletters",
            "Saisonale Kampagnen mit dem Produktteam",
          ],
        ),
      ],
      skills: [
        "Google Ads",
        "SEO",
        "Meta Ads",
        "Google Analytics",
        "E-Mail-Marketing",
      ],
      education: [
        {
          id: "f1",
          degree: "Master Digitales Marketing",
          school: "Universität Hamburg",
          year: "2015",
        },
      ],
      languages: [
        { id: "l1", name: "Englisch", level: "C1" },
        { id: "l2", name: "Französisch", level: "B2" },
      ],
    },
  },
};

/** Silhouette neutre à la place d'une vraie photo (aucune personne réelle). */
function silhouette() {
  const canvas = createCanvas(600, 600);
  const context = canvas.getContext("2d");
  context.fillStyle = "#cbd5e1";
  context.fillRect(0, 0, 600, 600);
  context.fillStyle = "#64748b";
  context.beginPath();
  context.arc(300, 220, 100, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(300, 560, 190, 200, 0, 0, Math.PI * 2);
  context.fill();
  return canvas.toBuffer("image/jpeg", 85);
}

it("génère les miniatures des modèles", async () => {
  const photo = silhouette();
  for (const [locale, demo] of Object.entries(DEMOS)) {
    mkdirSync(path.join(OUT_DIR, locale), { recursive: true });
    for (const template of CV_TEMPLATES) {
      const pdf = await renderCvPdf(
        demo.content,
        { language: locale, titles: demo.sections },
        { template, photo },
      );
      const image = await renderPageAsImage(new Uint8Array(pdf), 1, {
        canvasImport: () => import("@napi-rs/canvas"),
        width: WIDTH,
        format: "webp",
      });
      writeFileSync(path.join(OUT_DIR, locale, `${template}.webp`), image);
    }
  }
}, 300_000);
