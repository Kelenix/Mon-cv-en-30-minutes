import type { Guide } from "../../types";
import { cvAideSoignant } from "./cv-aide-soignant";
import { cvAllemagne } from "./cv-allemagne";
import { cvAnglais } from "./cv-anglais";
import { cvBelgique } from "./cv-belgique";
import { cvCanadaQuebec } from "./cv-canada-quebec";
import { cvComptable } from "./cv-comptable";
import { cvEtudiantSansExperience } from "./cv-etudiant-sans-experience";
import { cvInfirmier } from "./cv-infirmier";
import { cvLuxembourg } from "./cv-luxembourg";
import { cvRoyaumeUni } from "./cv-royaume-uni";
import { cvSimple } from "./cv-simple";
import { cvStage3e } from "./cv-stage-3e";
import { cvSuisse } from "./cv-suisse";
import { cvVendeurCaissier } from "./cv-vendeur-caissier";
import { lettreMotivationAlternance } from "./lettre-motivation-alternance";
import { lettreMotivationCandidatureSpontanee } from "./lettre-motivation-candidature-spontanee";
import { lettreMotivationJobEtudiant } from "./lettre-motivation-job-etudiant";
import { lettreMotivationParcoursup } from "./lettre-motivation-parcoursup";
import { lettreMotivationReconversion } from "./lettre-motivation-reconversion";
import { lettreMotivationSimpleCourte } from "./lettre-motivation-simple-courte";
import { lettreMotivationStage } from "./lettre-motivation-stage";
import { lettreMotivationStage3e } from "./lettre-motivation-stage-3e";

/** Articles en français, dans l'ordre de la page « Conseils » au sein de chaque rubrique. */
export const FR_GUIDES: readonly Guide[] = [
  // Lettres : la saison d'abord (stage de 3e, puis Parcoursup).
  lettreMotivationStage3e,
  lettreMotivationParcoursup,
  lettreMotivationStage,
  lettreMotivationAlternance,
  lettreMotivationCandidatureSpontanee,
  lettreMotivationJobEtudiant,
  lettreMotivationReconversion,
  lettreMotivationSimpleCourte,
  // CV par situation et par métier.
  cvSimple,
  cvEtudiantSansExperience,
  cvStage3e,
  cvAideSoignant,
  cvInfirmier,
  cvVendeurCaissier,
  cvComptable,
  cvAnglais,
  // CV par pays.
  cvSuisse,
  cvBelgique,
  cvCanadaQuebec,
  cvAllemagne,
  cvRoyaumeUni,
  cvLuxembourg,
];
