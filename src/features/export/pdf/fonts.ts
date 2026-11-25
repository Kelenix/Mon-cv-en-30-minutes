import path from "node:path";
import { Font } from "@react-pdf/renderer";

// Polices intégrées aux PDF (licences libres, lues à l'exécution : next.config.ts) : Arimo (mêmes
// dimensions qu'Arial) pour le texte, Poppins pour les titres des modèles modernes, Lora pour le
// modèle élégant. Tous les caractères des langues européennes s'affichent.

/** Fichier d'une police de @expo-google-fonts : `<paquet>/<style>/<Famille>_<style>.ttf`. */
function fontFile(family: "Arimo" | "Poppins" | "Lora", style: string) {
  return path.join(
    process.cwd(),
    "node_modules/@expo-google-fonts",
    family.toLowerCase(),
    style,
    `${family}_${style}.ttf`,
  );
}

Font.register({
  family: "Arimo",
  fonts: [
    { src: fontFile("Arimo", "400Regular") },
    { src: fontFile("Arimo", "700Bold"), fontWeight: 700 },
  ],
});

Font.register({
  family: "Poppins",
  fonts: [
    { src: fontFile("Poppins", "400Regular") },
    { src: fontFile("Poppins", "600SemiBold"), fontWeight: 600 },
  ],
});

Font.register({
  family: "Lora",
  fonts: [
    { src: fontFile("Lora", "400Regular") },
    { src: fontFile("Lora", "400Regular_Italic"), fontStyle: "italic" },
    { src: fontFile("Lora", "700Bold"), fontWeight: 700 },
  ],
});

// Aucune césure : un mot-clé coupé ne serait plus reconnu par les logiciels de recrutement.
Font.registerHyphenationCallback((word) => [word]);
