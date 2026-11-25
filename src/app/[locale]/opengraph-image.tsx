/* eslint-disable @next/next/no-img-element -- image produite par ImageResponse, où next/image n'existe pas. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import logoBadgeFr from "@/assets/brand/logo-badge-fr.png";
import logoIcon from "@/assets/brand/logo-icone.png";
import hero from "@/assets/marketing/hero-illustration.png";
import { type AppLocale, routing } from "@/i18n/routing";

// Image de partage (Open Graph, carte large, US-39 c.1), dans chaque langue, aux couleurs de la
// marque : logo en badge (en français, ADR-046 ; ailleurs, l'icône et le nom traduit), promesse,
// illustration.

export const alt = "Mon CV en 30 Secondes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Une image par langue, produite au build. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const asset = async (file: string) =>
  `data:image/png;base64,${await readFile(join(process.cwd(), "src/assets", file), "base64")}`;

/** Poppins, police de la charte (§2), dans les graisses utilisées. */
const poppins = (weight: 400 | 600 | 700, file: string) =>
  readFile(
    join(process.cwd(), "node_modules/@expo-google-fonts/poppins", file),
  ).then((data) => ({
    name: "Poppins",
    data,
    weight,
    style: "normal" as const,
  }));

const [logoBadgeFrSrc, logoIconSrc, heroSrc, ...fonts] = await Promise.all([
  asset("brand/logo-badge-fr.png"),
  asset("brand/logo-icone.png"),
  asset("marketing/hero-illustration.png"),
  poppins(400, "400Regular/Poppins_400Regular.ttf"),
  poppins(600, "600SemiBold/Poppins_600SemiBold.ttf"),
  poppins(700, "700Bold/Poppins_700Bold.ttf"),
]);

const LOGO_HEIGHT = 96;
const BADGE_HEIGHT = 170;
const HERO_WIDTH = 480;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale });
  // Titre de l'accueil sans sa mise en valeur (balises <highlight>).
  const headline = t.raw("home.title").replace(/<\/?\w+>/g, "") as string;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        gap: 40,
        padding: "56px 64px",
        backgroundImage:
          "linear-gradient(135deg, #ffffff 0%, #e6f0ff 55%, #cfe2ff 100%)",
        color: "#0b1f3a",
        fontFamily: "Poppins",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}
      >
        {locale === "fr" ? (
          <img
            src={logoBadgeFrSrc}
            alt=""
            height={BADGE_HEIGHT}
            width={(logoBadgeFr.width * BADGE_HEIGHT) / logoBadgeFr.height}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={logoIconSrc}
              alt=""
              height={LOGO_HEIGHT}
              width={(logoIcon.width * LOGO_HEIGHT) / logoIcon.height}
            />
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>
              {t("brand.name")}
            </div>
          </div>
        )}
        <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.15 }}>
          {headline}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {[
            t("home.highlights.freeFirstCv"),
            t("home.highlights.noCard"),
            t("home.highlights.cvLanguages"),
          ].map((point) => (
            <div
              key={point}
              style={{
                display: "flex",
                flexShrink: 0,
                padding: "8px 18px",
                borderRadius: 999,
                background: "#0f6fe6",
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {point}
            </div>
          ))}
        </div>
      </div>
      <img
        src={heroSrc}
        alt=""
        width={HERO_WIDTH}
        height={(hero.height * HERO_WIDTH) / hero.width}
      />
    </div>,
    { ...size, fonts },
  );
}
