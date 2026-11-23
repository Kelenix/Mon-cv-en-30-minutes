# Plan de réalisation — Mon CV en 30 Secondes (version Web)

> Phase 0 — Cadrage. **Statut : validé le 23/11/2026.** User stories : `docs/product/user-stories.md`.
> Sources : `INTAKE.md`, kits UI fournis. Décisions : `DECISION_LOG.md`. Suivi : `PROJECT_STATE.md`.

---

## 1. Compréhension du besoin

**Objectif.** Une plateforme web en français, responsive, qui permet de créer gratuitement un
premier CV avec l'IA à partir de 5 questions. Les outils avancés sont payants : amélioration,
adaptation à une offre, version LinkedIn, lettre de motivation, simulation d'entretien. Ils se
paient avec des crédits IA, les formules Essential / Pro / Premium, le CV Pro à l'unité. Le retrait
des publicités est aussi vendu.

**Parcours principal (§14).** Accueil → « Créer mon CV gratuitement » → 5 questions → génération
IA → aperçu → copier / modifier → PDF avec filigrane → proposition des offres (après la première
génération réussie) → achat de crédits, d'un CV Pro ou d'un abonnement.

**Périmètre.** Les 20 éléments du §19, tous rattachés à un incrément (§5 ci-dessous).

**Hors périmètre** (non demandé, ne sera pas construit) : application mobile, back-office
d'administration (le support passe par les tableaux de bord Supabase et du prestataire de
paiement), choix entre plusieurs modèles de CV, import d'un CV existant, espace
« conseils carrière », blog, statistiques d'usage.

**Ajout demandé le 23/11/2026** : site multilingue (français, anglais, italien, espagnol,
allemand) dès le lancement, avec langue du CV au choix et nom de marque traduit (ADR-018,
US-41, US-42).

---

## 2. Contradictions relevées dans l'INTAKE et résolution

| # | Constat | Résolution retenue |
|---|---------|--------------------|
| C1 | §4.3 et §15 décrivent l'ancienne offre « Pro mensuel / annuel » ; §12 la remplace par Essential / Pro / Premium. | §12 fait foi (il l'annonce lui-même). Accueil et tarifs présentent : Gratuit, Crédits IA, Essential, **Pro (recommandé)**, Premium, CV Pro à l'unité. |
| C2 | §15 promet « CV et lettres de motivation illimités », alors que Pro = 60 crédits/mois. | Texte corrigé (« 60 crédits IA par mois »). Une promesse « illimitée » serait une pratique commerciale trompeuse. |
| C3 | §15 annonce « 39,99 €/an — économise 43 % ». Calcul : 39,99 € contre 12 × 6,99 € = 83,88 €, soit **−52 %**. | Le pourcentage est calculé à partir des prix : Essential −37 %, Pro −52 %, Premium −42 %. |
| C4 | §8 et §9 : lettre et entretien « accessibles selon les crédits ». §12 : « Non » pour Essential. | **Question Q2.** |
| C5 | §6 : « cinq variantes d'accroche ». §12 : « variantes de titre professionnel : 3 / 5 / 5 ». | Même fonctionnalité. Essential : 3, Pro et Premium : 5, sans abonnement : 3. Coût : 1 crédit (« améliorer une accroche »). |
| C6 | Interstitiel « après la première génération », mais « aucune publicité avant l'aperçu ». | Interstitiel affiché une seule fois, **après** l'aperçu, quand l'utilisateur quitte la page d'aperçu. |
| C7 | Publicité native « historique ou conseils carrière ». Aucun espace conseils carrière n'est au périmètre. | Publicité native uniquement dans l'historique. |
| C8 | Deux kits UI : web (bleu / jaune, conforme au §2.1) et app (violet #7C3AED, mascotte robot). | Le web suit le §2.1 et le kit web. L'écart avec le kit mobile est à arbitrer côté mobile. |
| C9 | L'analyse des mots-clés manquants n'a pas de coût dans la grille du §11.1. | Incluse dans « Adapter un CV à une offre » (2 crédits) : un seul appel produit le CV adapté et les mots-clés manquants. |

---

## 3. Hypothèses retenues (contestables à tout moment)

| # | Hypothèse |
|---|-----------|
| H1 | **Remplacée le 23/11/2026 (ADR-018)** : interface en français, anglais, italien, espagnol et allemand dès le lancement ; langue du CV au choix, par défaut celle de l'interface. |
| H2 | Un seul modèle de mise en page de CV, sobre et lisible par les logiciels de recrutement (ATS). |
| H3 | Premier CV gratuit : 1 génération offerte par compte, hors crédits. Chaque régénération coûte 1 crédit. |
| H4 | Deux soldes de crédits distincts (§12). Les crédits **inclus** viennent de l'abonnement : remis au quota chaque mois, sans report. Les crédits **achetés** viennent des packs et des vidéos récompensées : ils n'expirent pas. Les crédits inclus sont consommés en premier. |
| H5 | Abonnement annuel : crédits réalloués **chaque mois** (§12) par une tâche planifiée. |
| H6 | Montée de formule immédiate, au prorata. Descente à la fin de la période en cours. Changement et résiliation en ligne via le portail client du prestataire de paiement. |
| H7 | Essai gratuit de 3 jours sur la formule Pro (mensuelle ou annuelle), une fois par compte, moyen de paiement requis. 10 crédits d'essai ; les 60 crédits mensuels sont alloués au premier paiement (Q5). |
| H8 | CV Pro à l'unité (4,99 €) : débloque définitivement **un** CV (PDF sans filigrane et DOCX pour ce CV). |
| H9 | Retrait des publicités (2,99 €) : achat unique et définitif, activable par configuration (« si cette option est activée »). |
| H10 | Vidéo récompensée : +1 crédit (solde « acheté »), plafond de 3 par jour et par compte (anti-fraude). |
| H11 | Priorité des générations IA : limites de débit par formule (Gratuit < Essential < Pro < Premium). |
| H12 | Historique : Gratuit, crédits seuls et Essential conservent **1 CV**. Une nouvelle génération remplace l'actuel, après confirmation. Pro et Premium : historique illimité (§10, §12). |
| H13 | Simulation d'entretien (2 crédits) : 8 questions personnalisées (CV + poste visé), réponses écrites, puis retour de l'IA sur chaque réponse. |
| H14 | Lettre de motivation (2 crédits) : à partir du CV et du poste visé, annonce facultative. Version LinkedIn (1 crédit) : titre, section « Infos », expériences reformulées, prêts à copier. |
| H15 | Publicités pour les comptes sans abonnement ni retrait des pubs, via Google AdSense / Ad Manager, après consentement (bandeau cookies certifié). Jamais pendant la saisie ni avant l'aperçu. |
| H16 | Conformité : données hébergées dans l'UE. Suppression du compte en libre-service. Case de renonciation au droit de rétractation pour les contenus numériques fournis immédiatement. Prix affichés TTC en euros. |
| H17 | Backend propre à la version web. Le modèle de données enregistre la source de chaque abonnement (web, App Store, Play Store) pour qu'une app mobile puisse s'y brancher plus tard. Cette intégration n'est pas construite maintenant. |

---

## 4. Architecture cible (résumé, détaillée en phase 3)

```
Navigateur ──► Next.js (App Router, TypeScript) hébergé sur Vercel
                 │  Server Actions / Route Handlers : validation Zod, droits vérifiés côté serveur
                 ├──► Supabase (Postgres + Auth, RLS sur toutes les tables, région UE)
                 ├──► API Claude (Anthropic, Claude Opus 5.5) : génération, sorties structurées validées
                 ├──► Stripe : Checkout, portail client, webhooks signés
                 └──► Exports PDF (@react-pdf/renderer) et DOCX (docx) générés côté serveur
```

- **Moteur de droits unique.** Il traduit une formule en fonctionnalités, quotas, nombre de
  variantes et priorité. Toute action IA passe par lui, côté serveur.
- **Crédits.** Débit atomique en base (fonction Postgres avec verrou) **avant** l'appel IA,
  remboursement automatique en cas d'échec, journal des mouvements non modifiable.
- **Paiements.** Webhooks idempotents (journal des événements déjà traités).
- **Filigrane.** Appliqué côté serveur au moment de l'export, donc non contournable.
- **IA.** Sortie structurée validée par Zod. Consigne « ne rien inventer ». Le texte d'une annonce
  est traité comme une donnée, jamais comme une instruction (anti-injection).
- **Pas de stockage de fichiers.** PDF et DOCX sont générés à la demande.
- **Développement local (ADR-007).** Supabase et la CLI Stripe tournent dans Docker Desktop ;
  Next.js tourne sur la machine avec Node.js 24.
- Stack par défaut du skill : Tailwind CSS + shadcn/ui, TanStack Query, Vitest + Playwright,
  GitHub Actions.

---

## 5. Incréments verticaux (ordonnés)

**MVP = Inc-0 à Inc-6** : le parcours du §14 complet, monétisation comprise.
QA (13), revue de code (15) et sécurité (09) interviennent sur chaque incrément.

| ID | Incrément | Exigences | Rôles | Taille | Critère d'acceptation principal |
|----|-----------|-----------|-------|--------|---------------------------------|
| Inc-0 | Socle technique | §2, §16, multilingue | 03, 04, 05, 06, 12 | L | `npm run dev` démarre. Lint, types, tests et build verts en CI. Palette du §2.1 et Poppins en place. Routage dans les 5 langues et sélecteur de langue en place. |
| Inc-1 | Accueil + page Tarifs | §4, §12, §15 | 06, 07, 10 | M | Un visiteur voit le hero, les 6 fonctionnalités, les offres et le bouton « Créer mon CV gratuitement ». Pro est mis en avant. Prix et crédits visibles avant toute souscription. |
| Inc-2 | Comptes | §3 (espace compte) | 08, 09, 07 | M | Inscription et connexion, profil, déconnexion, suppression du compte et de ses données. RLS testée. |
| Inc-3 | Crédits & droits | §11, §12 (règles) | 05, 08, 09 | L | Soldes inclus et achetés affichés. Débit atomique. Aucun appel IA sans droit ni solde. Tests de concurrence. |
| Inc-4 | Création de CV par IA | §5.1, §5.2, §14, §17 | 07, 08, 09 | L | 5 questions → CV structuré, avec un état de chargement explicite. Aperçu, copie, modification manuelle, sauvegarde. Première génération gratuite. |
| Inc-5 | Exports | §5.3 | 08, 07 | M | Gratuit : PDF avec filigrane « Créé avec Mon CV en 30 Secondes ». Abonné ou CV Pro : PDF sans filigrane et DOCX. |
| Inc-6 | Paiements | §11.2, §12, §14, §15, §18 | 08, 09, 07, 12 | XL | Packs de crédits, CV Pro, 3 formules × mensuel/annuel, essai de 3 jours. Changement et résiliation de formule. Crédits réalloués chaque mois. Offre proposée après la première génération. Formule, solde et date de renouvellement visibles. |
| Inc-7 | Amélioration IA | §6 | 07, 08 | L | Améliorer une expérience (1 crédit), une accroche avec 3 ou 5 variantes (1), adapter à une offre avec mots-clés manquants (2), selon les droits. |
| Inc-8 | LinkedIn + lettre de motivation | §7, §8 | 07, 08 | M | Contenus générés, modifiables et copiables, selon les droits et les crédits. |
| Inc-9 | Simulation d'entretien | §9 | 07, 08 | M | Questions personnalisées, réponses écrites, retour par réponse. |
| Inc-10 | Historique des CV | §10 | 07, 08 | S | 1 CV conservé ou historique illimité selon la formule. Consultation des CV enregistrés. |
| Inc-11 | Publicités | §13, §18 | 07, 09, 10 | L | Consentement, bannière, native, interstitiel (une fois), vidéo récompensée (+1 crédit, plafonnée), achat du retrait des pubs. Aucune publicité pour les abonnés ni après retrait des pubs. Jamais pendant la saisie ni avant l'aperçu. |
| Inc-12 | Finitions UX, SEO, performance, accessibilité | §16, §17 | 10, 11, 13 | M | Rendu validé à 1440 px, sur tablette et sur mobile. Lighthouse ≥ 90 sur l'accueil et les tarifs. |
| Inc-13 | Mise en production & passation | Projet entier | 12, 16, 14, 18, 17, 15 | M | Build de production et CI/CD verts, revue de sécurité finale, suppression automatique des comptes inactifs (US-40), documentation complète, tâches manuelles listées. |

---

## 6. Séquence des phases et rôles activés

| Phase | Contenu | Livrables |
|-------|---------|-----------|
| 0 Cadrage | Ce document | `PLAN_DE_REALISATION.md`, `PROJECT_STATE.md`, `DECISION_LOG.md` |
| 1 Produit (01) | User stories, critères Given/When/Then, MoSCoW | `docs/product/user-stories.md` |
| 2 Planification (02) | Backlog, jalons, risques détaillés | `PROJECT_STATE.md` |
| 3 Architecture & design (03, 04, 05, 06) | Architecture, modèle de données + RLS, design system | `docs/architecture.md`, `docs/data-model.md` |
| 4 Implémentation (07, 08, 09) | Inc-0 → Inc-12 | Code + tests par incrément |
| 5 Qualité (13, 15, 11) | En continu | Tests verts, revues |
| 6 Production (12, 16, 10) | Inc-13 | Déploiement Vercel, CI/CD |
| 7 Documentation (14, 18) | Au fil de l'eau, finalisée en fin de projet | README, docs, `CHANGELOG.md` |
| 8 Maintenance (17) | Passation | Plan de suivi, dette technique |

**On commence par** le socle (Inc-0) puis le parcours gratuit (Inc-1 à Inc-5).
**On finit par** la mise en production et la passation (Inc-13).

---

## 7. Risques & parades

| Risque | Prob. × impact | Parade |
|--------|----------------|--------|
| Coût IA supérieur au revenu sur Premium annuel | Moyenne × fort | Choix du modèle (Q4), effort de réflexion bas, cache de prompt, suivi du coût par opération, limites de débit. |
| Fraude sur la vidéo récompensée (signal envoyé par le navigateur) | Haute × faible | Plafond quotidien, jeton à usage unique émis par le serveur. |
| Abus du CV gratuit (comptes multiples) | Moyenne × moyen | Compte requis avant génération (Q3), e-mail vérifié, limite par adresse IP. |
| Non-conformité (RGPD, cookies publicitaires, rétractation, résiliation en ligne, promesses de prix) | Moyenne × fort | Bandeau de consentement certifié, pages légales, case de renonciation, portail de résiliation, corrections C2 et C3. |
| Hébergement : le plan Hobby de Vercel interdit l'usage commercial ; Supabase Free se met en pause après 7 jours d'inactivité | Certaine × moyen | Passage aux plans payants au lancement (§8). |
| Comptes publicitaires non approuvés au lancement (trafic requis) | Haute × faible | Code prêt et activé par configuration dès l'approbation. |
| L'IA invente des expériences | Moyenne × fort | Consignes strictes, sortie structurée validée, modification manuelle toujours possible. |
| Injection de consignes via le texte d'une annonce | Moyenne × moyen | Annonce traitée comme une donnée, sortie structurée, aucun outil exposé au modèle. |
| E-mails de connexion non délivrés (SMTP Supabase par défaut très limité) | Haute × moyen | Fournisseur SMTP dédié (tâche manuelle). |
| Webhooks de paiement en double ou dans le désordre | Moyenne × fort | Journal d'idempotence, mises à jour tolérantes à l'ordre. |

---

## 8. Coûts récurrents prévisibles

Ordres de grandeur à vérifier sur les sites des fournisseurs avant engagement.

| Poste | Pendant le développement | Au lancement commercial |
|-------|--------------------------|-------------------------|
| Hébergement Vercel | Hobby, gratuit | **Pro, environ 20 $/mois** (Hobby interdit l'usage commercial) |
| Base Supabase | Free, gratuit | **Pro, environ 25 $/mois** (Free se met en pause après 7 jours d'inactivité) |
| IA Claude | À l'usage, quelques dollars | À l'usage, voir Q4 |
| Paiement | Mode test, gratuit | Commission par transaction, voir Q1 |
| E-mails d'authentification | Palier gratuit | Palier gratuit puis payant selon le volume |
| Nom de domaine | — | Environ 10 à 15 €/an |

---

## 9. Tâches manuelles prévues

Détail (pourquoi, quand, étapes, coût, vérification) dans `docs/manual-tasks.md`.
Celles marquées ⏱ prennent du temps côté fournisseur : à lancer tôt.

1. ✅ Node.js 24 et Docker Desktop : déjà installés, Docker Desktop démarré.
2. Créer le projet Supabase en ligne (région UE), seulement pour la mise en production.
3. Créer une clé API Anthropic et fixer une limite de dépenses.
4. ⏱ Ouvrir et faire valider le compte du prestataire de paiement (selon Q1).
5. Créer les identifiants Google OAuth (connexion « Continuer avec Google »).
6. Configurer un fournisseur SMTP pour les e-mails de connexion.
7. Fournir les informations légales du vendeur (raison sociale, SIRET, adresse, contact,
   directeur de la publication) et faire relire CGV et politique de confidentialité par un juriste.
8. Fournir le logo et les illustrations en fichiers séparés (SVG ou PNG transparent). Les kits
   fournis sont des planches composites dont le fond en damier est incrusté dans l'image.
9. Créer le projet Vercel, le domaine et les variables d'environnement (en Inc-13).
10. ⏱ Demander l'approbation AdSense / Ad Manager une fois le site en ligne (Inc-11).

---

## 10. Questions — réponses de l'utilisateur (23/11/2026)

| # | Sujet | Décision |
|---|-------|----------|
| Q1 | Prestataire de paiement | **Stripe** |
| Q2 | Fonctions « Pro » sans formule Pro | **Accessibles via les crédits achetés** ; les crédits inclus d'Essential ne les débloquent pas |
| Q3 | Création du compte | **Juste avant la génération** (5 questions sans compte) |
| Q4 | Modèle d'IA | **Claude Opus 5.5**, en connaissance du risque de marge sur Premium annuel |
| Q5 | Crédits pendant l'essai de 3 jours | **10 crédits d'essai**, 60 au premier paiement |
| Q6 | App mobile / backend existant | **Aucun** : backend web propre, prêt pour le mobile (H17) |
| Q7 | Langues proposées | **Français, anglais, italien, espagnol, allemand** |
| Q8 | Calendrier des traductions | **Toutes les langues dès le lancement** |
| Q9 | Langue du CV et des contenus | **Au choix, par défaut la langue de l'interface** |
| Q10 | Nom de marque | **Traduit par langue** (propositions à valider, H31) |

Options telles qu'elles ont été proposées :

### Q1 — Prestataire de paiement (financier, légal)
L'INTAKE le laisse « à définir » (§18).
- **A. Stripe (recommandé).** Commission UE d'environ 1,5 % + 0,25 € par carte. Gère abonnements,
  essais, achats uniques et portail client (changement et résiliation en ligne). Intégration la
  plus standard avec Next.js et Supabase. La TVA reste à votre charge (Stripe Tax en option pour
  le calcul).
- **B. Paddle (marchand officiel).** Collecte et reverse la TVA UE et facture à votre place.
  Commission plus élevée, environ 5 % + 0,50 $ par transaction.

*Défaut : A.*

### Q2 — Accès aux fonctions « Pro » sans formule Pro (métier)
Fonctions concernées : adaptation à une offre, mots-clés manquants, lettre, entretien, ainsi que
LinkedIn pour les non-abonnés. §8 et §9 les ouvrent « selon les crédits », §12 les refuse à
Essential.
- **A. Recommandé.** Accessibles à tous en payant avec des crédits **achetés**. Les crédits
  **inclus** d'Essential ne les débloquent pas. Incluses dans Pro et Premium. Respecte à la fois
  §8/§9 et §12.
- **B.** Strictement réservées à Pro et Premium. Les packs ne servent qu'aux fonctions de base.
- **C.** Accessibles avec n'importe quels crédits, inclus ceux d'Essential. La colonne « Non »
  d'Essential n'a alors plus d'effet.

*Défaut : A.*

### Q3 — Moment de la création du compte (métier, coût)
- **A. Recommandé.** Les 5 questions sans compte, puis création du compte (Google ou e-mail) juste
  avant la génération. Le CV est sauvegardé et le quota gratuit est protégé.
- **B.** Génération sans compte (quota par appareil, facile à contourner), compte demandé à
  l'export.
- **C.** Compte obligatoire dès le départ.

*Défaut : A.*

### Q4 — Modèle d'IA (financier)
Estimation pour une opération courante : environ 2 000 tokens en entrée et 2 000 en sortie.

| Modèle | Prix entrée / sortie (par million de tokens) | Coût estimé par crédit | Abonné Premium consommant ses 150 crédits |
|--------|----------------------------------------------|------------------------|-------------------------------------------|
| Claude Opus 5.5 | 4 $ / 20 $ | ≈ 0,05 $ | ≈ 7,50 $/mois |
| Claude Sonnet 5.5 | 2 $ / 10 $ | ≈ 0,025 $ | ≈ 3,75 $/mois |
| Claude Haiku 5.5 | 0,10 $ / 0,50 $ | ≈ 0,001 $ | ≈ 0,20 $/mois |

Repère : Premium annuel rapporte environ 4,86 € HT par mois (69,99 € TTC par an). Avec Opus 5.5, un
abonné Premium annuel qui consomme tous ses crédits coûte plus qu'il ne rapporte. Le modèle reste
modifiable par configuration et pourra être mesuré sur de vraies générations.

*Défaut : Claude Opus 5.5 (qualité maximale).*

### Q5 — Crédits pendant l'essai gratuit de 3 jours (financier)
- **A. Recommandé.** Accès aux fonctions Pro avec 10 crédits d'essai. Les 60 crédits sont alloués
  au premier paiement.
- **B.** 60 crédits dès le début de l'essai (risque : s'inscrire, tout consommer, résilier).

*Défaut : A.*

### Q6 — Application mobile existante (irréversible)
Existe-t-il déjà une app mobile ou un backend (comptes, abonnements) que le web doit partager ?

*Défaut : non. Le web a son propre backend, prêt à accueillir le mobile plus tard (H17).*
