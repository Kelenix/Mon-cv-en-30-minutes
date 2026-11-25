# État du projet — PROJECT_STATE

> Mis à jour par Claude à la fin de chaque phase / incrément. Permet de **reprendre** le
> travail à tout moment, même dans une nouvelle session. Toujours lire ce fichier avant d'agir.

## Snapshot

- **Phase courante** : 8 — Maintenance. La mise en production (phase 6) est terminée :
  **site en ligne sur https://cv30secondes.com** depuis le 25/11/2026.
  - Ce qui fonctionne en ligne : paiements Stripe en mode réel, connexion par e-mail et avec
    Google (vérifiée par l'utilisateur), logo en badge et mascotte.
  - Exploitation : déploiement par GitHub et surveillance toutes les 10 minutes.
- **Dernière mise à jour** : 25/11/2026
- **Santé** : 🟢 OK
- **Prochaine action** : sauvegardes hors du serveur (tâche 15, étapes 2 et 3, dans hPanel).
  Ensuite, sur le domaine :
  - mesure Lighthouse (NFR-01) ;
  - un premier achat réel de bout en bout (paiement, webhook, crédits) ;
  - qualité réelle des outils IA (US-25 c.3, US-27 c.5, NFR-02 ; la création de CV est déjà
    mesurée, ADR-041) ;
  - tâche 10 : l'utilisateur garde un seul compte AdSense qui accepte les sites et donne son
    identifiant `pub-…` ; Claude active alors `ADS_MODE=adsense` sur le serveur ;
  - tâche 12. Les noms de marque traduits restent ceux proposés tant qu'elle n'est pas faite ;
  - dans quelques jours : vérifier dans Search Console que l'accueil et les tarifs sont
    indexés (tâche 13).
- **Git** : **toute mise en ligne passe par GitHub** (choix de l'utilisateur). Envoi sur `main`,
  CI, puis workflow « Déploiement » qui lance `deploy.sh` sur le KVM 2. Le serveur lit `origin`
  sur GitHub avec sa clé en lecture seule.

## Avancement par phase

| Phase | État | Notes |
|-------|------|-------|
| 0 — Cadrage & intake        | ✅ fait | Plan validé, Q1–Q6 tranchées |
| 1 — Définition produit      | ✅ fait | 39 stories, matrice des droits, NFR, traçabilité (`docs/product/user-stories.md`) |
| 2 — Planification           | ✅ fait | Jalons M0–M6, chemin critique, `docs/risks.md` (aucun 🔴) |
| 3 — Architecture & design   | ✅ fait | `docs/architecture.md`, `docs/system-design.md`, `docs/data-model.md`, `docs/design/` ; ADR-009 à 017 |
| 4 — Implémentation          | ✅ fait | Inc-0 à Inc-14 ; jalons M0 à M6 atteints (publicités encore en simulation : tâche 10) |
| 5 — Qualité                 | ✅ fait | En continu ; revue de sécurité finale à l'Inc-13 (`docs/security.md`) ; CI verte à chaque envoi |
| 6 — Mise en production      | ✅ fait | En ligne le 25/11/2026 sur le KVM 2 partagé (ADR-044, ADR-045), Stripe réel, Google en production |
| 7 — Documentation           | ✅ fait | README, `docs/deployment.md`, architecture, sécurité, tâches manuelles |
| 8 — Maintenance             | 🔄 en cours | Déploiement par GitHub, surveillance toutes les 10 min ; reste les sauvegardes hors du serveur (tâche 15) ; exploitation selon `docs/deployment.md` §13 à §17 |

> États : ⬜ à faire · 🔄 en cours · ✅ fait · ⏸️ en attente (raison)

## Backlog incréments (incrément vertical = livrable)

Ordre d'exécution = ordre du tableau. Détail des stories : `docs/product/user-stories.md`.
Taille relative : S / M / L / XL.

| ID | Incrément | Stories | Dépend de | Taille | Jalon | État |
|----|-----------|---------|-----------|--------|-------|------|
| Inc-0 | Socle technique (squelette qui tourne, 5 langues) | US-36, US-37 (bases), US-41 (fondations) | — | L | M0 | ✅ |
| Inc-1 | Accueil + Tarifs + pages légales | US-01, 02, 03, 38 | Inc-0 | M | M1 | ✅ (US-01 c.3 → Inc-4, US-03 c.2 → Inc-6) |
| Inc-2 | Comptes | US-04, 05, 06 | Inc-0 | M | M2 | ✅ (US-04 c.3 → Inc-4 ; US-05 c.1 et c.3, US-06 c.2 Stripe → Inc-3 et Inc-6) |
| Inc-3 | Crédits & droits | US-07, 08, 09 | Inc-2 | L | M2 | ✅ (US-07 c.2 → Inc-6 ; US-08 c.1, c.3, c.4 → Inc-4 ; US-09 c.2, c.4 → Inc-7) |
| Inc-4 | Création de CV par IA | US-10 à 15, US-42 | Inc-3, clé Anthropic | L | M2 | ✅ (US-11 c.4 et c.5 mesurés avec l'IA réelle : P95 de 5,9 s, aucun fait inventé, ADR-041 ; US-15 c.3 → Inc-6) |
| Inc-5 | Exports PDF / DOCX | US-16, 17 | Inc-4 | M | M2 | ✅ (US-17 c.1 vérifié avec un CV Pro posé en test ; achat et abonnements à l'Inc-6) |
| Inc-6 | Paiements | US-18 à 23, US-38 (CGV) | Inc-3, Inc-5, clés Stripe test | XL | M3 | ✅ code et tests ; Stripe réel branché en ligne le 25/11/2026 (tâche 4) ; premier achat réel à faire (US-38 c.3 : CGV déjà rédigées à l'Inc-1) |
| Inc-7 | Amélioration IA | US-25, 26, 27 | Inc-6 | L | M4 | ✅ (IA simulée ; US-25 c.3, US-27 c.5 et NFR-02 à mesurer avec la clé) |
| Inc-8 | LinkedIn + lettre de motivation | US-28, 29 | Inc-6 | M | M4 | ✅ (IA simulée ; qualité et NFR-02 à mesurer avec la clé) |
| Inc-9 | Simulation d'entretien | US-30 | Inc-6 | M | M4 | ✅ (IA simulée ; qualité et NFR-02 à mesurer avec la clé) |
| Inc-10 | Historique des CV | US-31 | Inc-6 | S | M4 | ✅ (bannière et publicité native de la liste à l'Inc-11) |
| Inc-11 | Publicités + retrait des pubs | US-24, 32 à 35 | Inc-6 | L | M5 | ✅ en simulation ; mode AdSense prêt (bannière et native, ADR-047), activation : tâche 10 |
| Inc-12 | Finitions UX, SEO, performance, accessibilité | US-39, audit US-36/37 | Inc-11 | M | M6 | ✅ (Lighthouse local : performance 90 et 91, SEO 100 ; mesure sur le domaine à faire) |
| Inc-13 | Mise en production & passation | US-40, DoD projet | Inc-12, tâches 3, 4, 6, 7, 9 | M | M6 | ✅ en ligne sur https://cv30secondes.com depuis le 25/11/2026 (KVM 2 partagé, ADR-044) ; déploiement par GitHub (tâche 14) |
| Inc-14 | Espace d'administration (demande de l'utilisateur) | — | Inc-13 | L | — | ✅ (ADR-040) |

## Jalons (chacun démontrable et testable)

| Jalon | Contenu | Démonstration | État |
|-------|---------|---------------|------|
| M0 — Squelette | Inc-0 | `npm run dev` affiche la page de base aux couleurs de la marque ; Supabase local tourne dans Docker ; CI verte (lint, types, tests, build) | ✅ |
| M1 — Vitrine | Inc-1 | Accueil, Tarifs et pages légales navigables, responsive, avec les vrais prix | ✅ |
| M2 — CV gratuit de bout en bout | Inc-2 à Inc-5 | Parcours §14 étapes 1 à 7 : questions → compte → génération → aperçu → copie / modification → PDF avec filigrane | ✅ |
| M3 — MVP monétisé | Inc-6 | Parcours §14 complet (étapes 1 à 9) en mode test Stripe : packs, CV Pro, formules, essai, portail, remise mensuelle | ✅ (mode réel ouvert en ligne) |
| M4 — Outils IA complets | Inc-7 à Inc-10 | Amélioration, adaptation + mots-clés, LinkedIn, lettre, entretien, historique | ✅ (qualité réelle à mesurer) |
| M5 — Publicités | Inc-11 | Consentement, emplacements avec blocs de test Google, vidéo récompensée, retrait des pubs | ✅ en simulation (tâche 10) |
| M6 — Prêt pour la production | Inc-12, Inc-13 | Site en ligne sur le domaine, CI/CD verte, revue de sécurité, documentation complète | ✅ le 25/11/2026 |

## Chemin critique et blocages

Chemin critique : **Inc-0 → Inc-2 → Inc-3 → Inc-4 → Inc-5 → Inc-6 → Inc-13**, parcouru
jusqu'au bout : mise en ligne le 25/11/2026.

| Tâche manuelle (`docs/manual-tasks.md`) | État | Remarque |
|-----------------------------------------|------|----------|
| 1 à 9, 11, 13, 14, 16, 17 | ✅ faites | Outils, clé Anthropic, Stripe réel, Google, Resend, infos légales, logo, VPS et domaine, GitHub, moteurs de recherche, déploiement automatique, Turnstile, administrateurs (tâche 2 sans objet) |
| 15 — Surveillance et sauvegardes hors du serveur | 🔄 | Surveillance faite ; sauvegardes hPanel et copie hebdomadaire à faire |
| 10 — Comptes publicitaires | 🔄 | Site prêt pour AdSense (ADR-047) ; bloqué côté comptes : un seul compte AdSense à garder, qui accepte les sites |
| 12 — Noms de marque et relecture des traductions | ⬜ | Noms proposés utilisés en attendant |

Risques : `docs/risks.md` (aucun 🔴).

## Décisions ouvertes / questions à l'utilisateur

Détail dans `docs/PLAN_DE_REALISATION.md` §10 et `DECISION_LOG.md` (ADR-006).

- [x] Q1 — Prestataire de paiement : Stripe
- [x] Q2 — Fonctions « Pro » sans formule Pro : via crédits achetés
- [x] Q3 — Création du compte : juste avant la génération
- [x] Q4 — Modèle d'IA : Claude Opus 5.5
- [x] Q5 — Crédits pendant l'essai de 3 jours : 10 crédits
- [x] Q6 — App mobile / backend existant : aucun
- [x] Q7 à Q10 — Multilingue : FR, EN, IT, ES, DE dès le lancement ; langue du CV au choix ;
  nom de marque traduit (ADR-018)
- [ ] Noms de marque par langue à valider (tâche manuelle 12 ; noms proposés utilisés en
  attendant)

## Blocages

- (aucun)

## Tâches manuelles utilisateur en attente

- voir `docs/manual-tasks.md`

## Journal de session (résumé court, le plus récent en haut)

- 25/11/2026 — **Tâche 10 : publicités par AdSense (ADR-047, choix de l'utilisateur)**.
  - Constat : Ad Manager sans inscription en libre-service ; comptes AdSense de l'utilisateur
    limités à YouTube (sans « Sites ») ou non approuvés pour doublon.
  - Nouveau mode `ADS_MODE=adsense` : bannière et native AdSense, même consentement, mêmes
    pages ; vidéo récompensée et interstitiel retirés dans ce mode (Ad Manager seulement).
    `ads.txt` servi dès l'identifiant d'éditeur connu.
  - Vérifié : build en mode AdSense (bloc `adsbygoogle` sur l'accueil, aucun sur les tarifs,
    `ads.txt`, CSP), Chromium (bandeau puis AdSense chargés, bloc traité), lint, types, tests
    unitaires, e2e publicités, crédits et audit en simulation.
  - Reste : comptes Google côté utilisateur (manual-tasks, tâche 10).

- 25/11/2026 — **Tâche 13 faite (moteurs de recherche)**.
  - Google Search Console : propriété « Domaine » validée par un enregistrement TXT chez
    Hostinger. Sitemap lu par Googlebot : « Opération effectuée », 30 pages découvertes.
  - Bing Webmaster Tools : `cv30secondes.com` importé depuis Search Console (lecture seule,
    accord de l'utilisateur ; l'autre site du compte n'a pas été importé). Sitemap envoyé, en
    cours de traitement.
  - Icône de l'onglet déployée (`77456cf`), vérifiée en ligne.

- 25/11/2026 — **Icône de l'onglet** (signalée par l'utilisateur) : l'icône Next.js du modèle
  de départ est remplacée par l'icône du logo (`favicon.ico` 16, 32 et 48 px). Ajout de
  `apple-icon.png` (180 px, fond blanc). Contrôlé sur onglet clair et sombre ; les deux balises
  sont générées par le build.

- 25/11/2026 — **Connexion vérifiée en production par l'utilisateur** après la correction de
  la redirection (`f865ce1`, CI et déploiement GitHub verts). État du projet remis à jour :
  phase 6 terminée, phase 8 (maintenance) en cours, tableaux des phases, des incréments, des
  jalons et des tâches manuelles alignés sur la mise en ligne.

- 25/11/2026 — **Correction : retour de connexion vers 0.0.0.0:3000** (signalé par l'utilisateur).
  En ligne, `/auth/callback` (Google) et `/auth/confirm` (lien de l'e-mail) redirigeaient vers
  l'adresse interne du conteneur (`request.url` vaut `https://0.0.0.0:3000` derrière le proxy).
  Redirection désormais relative dans `finishSignIn`. Tests de bout en bout des comptes : 24 sur
  24, dont le lien valide qui ouvre la session.

- 25/11/2026 — **Logo en badge et mascotte robot (tâche 8, ADR-046)** : badge en grand format et
  en français (partage, données structurées, colonne de la marque, pied de page), mascotte dans
  la colonne de la marque de toutes les langues. En-tête et accueil inchangés. Vérifié par
  captures (connexion FR et EN, pied de page, image de partage) et à 375 px sous Linux.

- 25/11/2026 — **Surveillance (tâche 15, étape 1)** : workflow GitHub « Surveillance » toutes les
  10 minutes (sonde, accueil, connexion), trois essais avant de signaler une panne. Essayé en
  local, site en service et site en panne (code 1). Pas de compte UptimeRobot : dépôt public,
  minutes gratuites, et tout reste dans GitHub. **Tâche 14** (déploiement automatique) faite : premier
  déploiement par GitHub de `2b4511d` réussi, avec la correction des tarifs et Google.

- 25/11/2026 — **Connexion Google en production (tâche 5)** : adresses de production ajoutées
  au client OAuth, Branding complété (accueil, confidentialité, CGV), application publiée en
  production, `GOOGLE_AUTH_ENABLED=true` et identifiants dans le `deploy/.env` du serveur, pris
  en compte au déploiement GitHub suivant.

- 25/11/2026 — **Déploiement par GitHub réparé** (demande de l'utilisateur : « tout doit passer
  par GitHub »).
  - Cause des déploiements « ignorés » : `DEPLOY_ENABLED` absente. Cause de la CI rouge depuis
    `ee79947` : débordement horizontal de `/fr/tarifs` à 375 px sous Linux. Le bouton « Essayer Pro
    gratuitement 3 jours » ne passait pas à la ligne et élargissait les cartes (379 px).
  - Correction : grille `grid-cols-1` et bouton d'essai qui passe à la ligne. Vérifié avec
    Chromium sous Linux (image Playwright) : 375 px sur les tarifs dans les 5 langues, l'accueil et
    les crédits.
  - Serveur : clé de lecture du dépôt (lecture seule), `origin` sur GitHub. GitHub Actions :
    clé limitée à `deploy.sh`, environnement `production` (3 secrets), `DEPLOY_ENABLED=true`.

- 25/11/2026 — **Paiements ouverts (Stripe en mode réel, tâche 4)**.
  - Clé secrète dédiée « Mon CV en 30 Secondes », après vérification par e-mail et code
    d'authentification saisis par l'utilisateur.
  - `stripe:seed --live` : produits, 11 prix et portail `moncv`. Webhook de production créé par
    l'API (8 événements, `app: moncv`). Clés reportées dans le `deploy/.env` du serveur (deux
    lignes seulement), `deploy.sh` vert.
  - Vérifié : session de paiement réelle de 2,99 € créée avec acceptation des CGV puis expirée,
    webhook à 400 sans signature, impayés par carte → abonnement annulé (réglage du compte).

- 25/11/2026 — **Site en ligne : https://cv30secondes.com** (version `f96ded6`, ADR-045).
  - Lancé sans paiement : clés Stripe facultatives en production (« momentanément
    indisponible »). Pages légales : seules les informations du vendeur fournies s'affichent,
    les autres sont facultatives (phrase retirée).
  - Code envoyé par SSH dans `/opt/mon-cv.git` (sans GitHub), `deploy/.env` complété depuis
    `.env.local` (IA, administrateur, informations du vendeur), secrets générés, `deploy.sh` :
    11 migrations, vérifications vertes.
  - Contrôles depuis Internet : pages en 0,2 à 0,4 s, pages légales sans valeur manquante dans
    les 5 langues, Turnstile chargé avec la bonne clé. La case « Vérifiez que vous êtes
    humain » est apparue dans le navigateur automatisé, et je ne la coche pas. Autres sites
    du serveur inchangés.

- 25/11/2026 — **Tâche 16 faite** : widget Turnstile « Mon CV en 30 Secondes » créé dans le compte
  Cloudflare de l'utilisateur (qui ne contenait qu'un widget d'un autre projet), clés rangées
  dans `deploy/.env` local, clé secrète acceptée par Cloudflare.

- 25/11/2026 — **VPS choisi : le KVM 2 existant**, partagé avec deux autres sites (ADR-044).
  - Le site passe derrière le nginx du serveur, qui tient HTTPS (certbot) ; Caddy reste en local
    (`127.0.0.1:8180`) pour l'aiguillage et l'adresse réelle du visiteur, vérifiée par un essai
    local. Le site joint son API par `host-gateway`.
  - `setup-vps.sh DOMAINE` installe nginx et certbot, sans mise à jour générale ni changement
    SSH sur un serveur en service. Lancé sur le KVM 2 : certificat obtenu, 2 Go de mémoire
    d'échange, autres sites inchangés.
  - DNS A et AAAA de `@` et `api` pointés vers le KVM 2.

- 25/11/2026 — **Tâche 6 faite** : domaine acheté par l'utilisateur, vérifié chez Resend
  (Ireland) grâce aux enregistrements DKIM, CNAME `rsend` et `send` et DMARC créés chez
  Hostinger. Clé d'envoi limitée au domaine, rangée dans `deploy/.env` local (non versionné),
  e-mail de test livré. Le VPS reste à choisir : celui en service fait déjà tourner nginx.

- 24/11/2026 — **Domaine choisi : cv30secondes.com** (ADR-043), libre à cette date, à acheter
  à l'étape 1 de la mise en ligne. Il est prérempli dans `deploy/.env.example` (site, API,
  adresse d'expédition) et reporté dans `docs/deployment.md` et `docs/manual-tasks.md`.

- 24/11/2026 — **Tâche 6 commencée** : compte Resend créé. Le domaine n'est pas encore acheté ;
  sa vérification chez Resend et la clé d'envoi suivront l'achat du domaine (étape 1 de la mise
  en ligne).

- 24/11/2026 — **Tâches 4 et 5 (mode test)**.
  - **Stripe** : compte « Kelenix Teck », partagé avec d'autres produits (ADR-042).
    - Le code ne touche plus qu'aux objets marqués `moncv` : clés de prix préfixées, portail
      dédié, webhook qui ignore les autres produits.
    - Achat d'un pack vérifié en local : paiement, webhook, crédits.
  - **Google OAuth** : projet `mon-cv-en-30-secondes`, client Web, Supabase local configuré ;
    connexion avec Google réussie en local. Un échec de connexion Google (invitation expirée)
    mène maintenant à la page de connexion avec une explication, au lieu de l'accueil (test
    e2e).
  - **Reste pour la mise en ligne** : libellé bancaire, réglage des impayés, mode réel ;
    publication de l'application Google avec le domaine.

- 24/11/2026 — **Tâche 7 commencée** : raison sociale, e-mail de contact, prénom du directeur de
  la publication et hébergeur sont dans `.env.local` et affichés sur les pages légales.
  - Reste à fournir : statut juridique, immatriculation, adresse du siège, nom complet du
    directeur de la publication, médiateur de la consommation, TVA s'il y a lieu.
  - Les mêmes valeurs iront dans `deploy/.env` sur le serveur (tâche 9).

- 24/11/2026 — **Création de CV mesurée avec l'IA réelle** (ADR-041, 0,72 $ approuvés) :
  - jeu de 20 profils de référence créé ; mesure lancée par `npm run eval:ai`, jamais en CI ;
  - P95 de 5,9 s, 20 générations réussies sur 20 ; aucune entreprise, date, diplôme ou
    certification inventée ; injection ignorée ; langue respectée ;
  - consigne corrigée : l'IA ne calcule plus de durée d'expérience (2 erreurs au premier
    passage) ;
  - US-11 c.4 et c.5 validés ; R02 clos.
  - Reste : mesurer les outils IA (US-25 c.3, US-27 c.5, NFR-02).

- 24/11/2026 — **Tâche 3 faite** : clé Anthropic vérifiée (Claude Opus 5.5 disponible) ; IA réelle
  en développement ; les tests de bout en bout forcent l'IA simulée (`AI_SIMULATION`, posé par
  `playwright.config.ts`) pour rester stables et gratuits. Reste : mesure de qualité réelle
  (US-11 c.4 et c.5, NFR-02).

- 24/11/2026 — **Inc-14 : espace d'administration** (demande de l'utilisateur) : `/admin` réservé
  à `ADMIN_EMAILS` (proxy, pages, actions), vue d'ensemble, utilisateurs (fiche, crédits offerts,
  suspension, suppression), revenus et moyens de paiement, IA, provenance (compteurs anonymes,
  pays DB-IP), état du système, journal ; graphiques Recharts ; webhook `invoice.paid` ;
  revenus et coûts gardés anonymes après suppression ; politique de confidentialité (5 langues) ;
  tâche 17. ADR-040.

- 24/11/2026 — **Protection contre les robots** (demande de l'utilisateur) : Cloudflare Turnstile
  à chaque envoi de code (invisible le plus souvent), plafonds par IP et par adresse e-mail en
  base, Cloudflare dans la politique de confidentialité, tâche 16. ADR-039. Page de connexion
  remplie (demande de l'utilisateur) : atouts du compte et lien vers les conditions sous le
  formulaire, colonne à la hauteur de l'illustration (vérifié à 1 440, 1 024 et 375 px).

- 24/11/2026 — **Inc-13 préparé** (demande : tout sur un VPS Hostinger) : `deploy/` avec Docker
  Compose (Caddy en HTTPS automatique, site Next.js autonome, PostgreSQL, authentification et API
  Supabase aux versions locales, Studio par tunnel SSH), scripts de préparation du serveur,
  secrets, déploiement avec vérifications et retour automatique, migrations, retour arrière,
  sauvegarde, restauration ; déploiement GitHub Actions après une CI verte (inactif tant que
  `DEPLOY_ENABLED` manque) ; US-40 (avertissement puis suppression des comptes inactifs) ;
  pages légales mises à jour (Hostinger) ; `docs/deployment.md` ; tâches 9, 14, 15 ; revue de
  sécurité finale. Répétition complète en local réussie (ADR-038). Vérifié : lint, types,
  format, tests unitaires, base, build, bout en bout, ShellCheck.

- 24/11/2026 — **Inc-12 terminé** : référencement (Open Graph et image de partage par langue,
  données structurées, robots.txt, sitemap multilingue, `hreflang` à une seule source, pages
  privées en `noindex`) ; CSP complète ; audit de 17 pages à 4 largeurs (défilement, tailles,
  zones tactiles, axe, CSP) : un débordement corrigé sur Tarifs (tableau). Lighthouse mobile local,
  médiane de 5 : accueil 90, tarifs 91 en performance, 100 ailleurs (ADR-037). Tâche 13 ajoutée.
- 24/11/2026 — **Inc-11 terminé (en simulation)** : Google Ad Manager et bandeau de
  consentement certifié de Google (mode `google`), annonces de test sans script externe (mode
  `simulation`) ; bannière en bas de l'accueil et de « Mes CV », annonce native dans « Mes CV »,
  rien pour les abonnés ni après le retrait ; vidéo récompensée (jeton à usage unique, 1 crédit,
  3 par jour) dans les crédits et « Solde insuffisant » ; interstitiel unique en quittant
  l'aperçu ; achat du retrait des publicités ; `/ads.txt` ; pas-à-pas de la tâche 10 ;
  5 langues. Vérifié : lint, types, tests unitaires, base, build, bout en bout en simulation.
  ADR-036.

- 24/11/2026 — **Transitions fluides** (demande de l'utilisateur) : fondus natifs entre les
  pages et à l'arrivée du contenu, onglets du CV persistants, titres immédiats, squelettes à la
  forme des pages et différés. Vérifié image par image, puis lint, types, tests unitaires, base,
  build, 152 tests de bout en bout. ADR-035.

- 24/11/2026 — **Inc-10 terminé (jalon M4)** : « Mes CV » en deux colonnes (cartes, panneau
  « Ton historique » avec la règle de la formule), affichage par 12, suppression d'un CV après
  confirmation (contenus compris), état vide ; correction : un ancien abonné Pro peut de
  nouveau créer un CV en en remplaçant un ; 5 langues. Vérifié : lint, types, tests unitaires,
  base, build, bout en bout (sur le build de production). ADR-034.

- 24/11/2026 — **Tous les écrans en pleine largeur** (demande de l'utilisateur) : assistant de
  création, connexion, bienvenue, génération, compte, crédits, pages légales et pages d'erreur ;
  colonne de la marque réutilisable. ADR-033.

- 24/11/2026 — **Inc-9 terminé** : onglet « Entretien » ; 8 questions adaptées au CV et au poste
  (2 crédits, langue au choix), réponses écrites, retour gratuit par question répondue (points
  forts, à améliorer, exemple) enregistré une seule fois avec la simulation ; opération sans
  débit journalisée et limitée ; correction directe des contenus limitée à LinkedIn et lettre
  (RLS) ; 5 langues. Vérifié : lint, types, tests unitaires, base, build, bout en bout (y compris
  sur le build de production). ADR-032.

- 23/11/2026 — **Inc-8 terminé** : onglets « LinkedIn » et « Lettre de motivation » ; version
  LinkedIn (titre, Infos, une description par expérience, limites de LinkedIn, reconstruite à
  partir du CV) et lettre (poste obligatoire, entreprise et annonce facultatives, nombre de mots),
  langue au choix, textes modifiables avec enregistrement automatique, copie bloc par bloc,
  versions conservées ; outils d'édition partagés avec l'éditeur du CV ; pages du CV en pleine
  largeur (formulaire à gauche, résultat à droite) ; historique de l'adaptation corrigé sur
  mobile ; 5 langues. Vérifié : lint, types, tests unitaires, base,
  build, bout en bout. ADR-031.

- 23/11/2026 — **Inc-7 terminé** : contenus générés conservés avec le CV (RLS), appel à Claude et
  opération payante mis en commun, amélioration d'une expérience (avant / après), 3 ou 5
  variantes d'accroche consultables ensuite, adaptation à une offre (mots-clés manquants,
  application ou nouveau CV en Pro/Premium) avec garantie serveur qu'aucune expérience ou
  compétence n'est ajoutée ; onglets du CV ; fenêtre « Solde insuffisant » commune (cas
  Essential) ; 5 langues. Vérifié : lint, types, tests unitaires, base, build, bout en bout.
  ADR-030.

- 23/11/2026 — **Inc-6 réalisé** : abonnements, achats et événements Stripe en base, fonctions
  serveur (achat livré une fois, synchronisation d'abonnement : essai, paiement, montée, descente,
  fin ; remise mensuelle et maintenance planifiées par pg_cron), webhook signé, Checkout
  (CGV et renonciation obligatoires), portail client, page « Crédits et formule », achats depuis
  Tarifs, l'aperçu (CV Pro) et « Solde insuffisant », résiliation à la suppression du compte ;
  5 langues. Vérifié sans Stripe réel (clés absentes) : lint, types, tests unitaires, base, build,
  bout en bout. ADR-029.

- 23/11/2026 — **Inc-5 terminé (jalon M2)** : PDF du CV (une colonne, police Arimo intégrée,
  aucune césure, filigrane dans la langue du CV sur chaque page sans droit) et DOCX (titres Word,
  listes) ; route d'export sécurisée (401, 403, 404) ; boutons dans l'aperçu, DOCX verrouillé
  avec explication. Texte extrait des fichiers vérifié par test (ordre des rubriques, aucune
  perte). Vérifié : lint, types, tests unitaires, base, build, bout en bout (y compris sur le
  build de production). ADR-028.

- 23/11/2026 — **Inc-4 terminé** : assistant des 5 questions (brouillon dans le navigateur,
  langue du CV au choix), génération par Claude (SDK officiel, flux, sortie structurée, repli
  automatique, consigne anti-invention et ATS) avec IA simulée sans clé, débit et remboursement
  en base dans trois fonctions serveur (gratuité de la première génération, plafond par IP,
  limite par minute, remplacement du CV), écran d'étapes et d'erreurs, fenêtres « Solde
  insuffisant » et « Remplacer un CV », aperçu et éditeur sur une colonne (modification sur
  place, enregistrement automatique, copie du texte), encart des offres, page « Mes CV », menu
  de l'en-tête sur mobile ; 5 langues. Vérifié : lint, types, 116 tests unitaires, 49 tests de
  la base, build, tests de bout en bout (voir CHANGELOG). ADR-027.

- 23/11/2026 — **Inc-3 terminé** : portefeuille (crédits inclus et achetés) et journal non
  modifiable, opérations IA journalisées, fonctions SQL de débit (verrou, inclus d'abord, pas de
  double débit), remboursement unique, ajout et remise des crédits inclus, toutes réservées au
  serveur ; moteur de droits testé sur toute la matrice ; solde dans l'en-tête (avec détail) et
  section « Formule et crédits » dans le compte, en 5 langues. Vérifié : lint, types, 104 tests
  unitaires, 32 tests de la base (dont 20 débits simultanés sur un solde de 5), build, 100 tests
  de bout en bout. ADR-026. Reste pour plus tard : coût sur les boutons IA, fenêtre « Solde
  insuffisant » et remboursement en cas d'échec (Inc-4), formule et dates (Inc-6), cadenas
  (Inc-7).

- 23/11/2026 — **Accueil refait** (critiques de l'utilisateur) : texte à gauche, illustration
  officielle du kit à droite (disposition choisie par l'utilisateur), textes orientés
  conversion et ATS dans les 5 langues, en-tête aligné et agrandi avec bouton « Créer mon CV »,
  conteneur élargi. Règle H34 « compatibilité ATS » ajoutée aux stories US-11 et US-17.
  Puis image agrandie (64 % de l'écran, passe derrière le texte avec un fondu, version 2x de
  l'illustration), et tailles bornées en rem pour suivre le zoom du navigateur (vérifié de 25 à
  200 %). ADR-025.

- 23/11/2026 — **Micro-interactions et accueil** (demandes de l'utilisateur) : liste de
  bibliothèques triée, seul le nécessaire appliqué (boutons de chargement, apparitions en
  fondu, aucune nouvelle dépendance) ; section d'accueil centrée sur la structure fournie ;
  tests de bout en bout stabilisés (3 navigateurs en parallèle). Accueil en plein premier
  écran, texte proportionnel à l'écran (vérifié sur 9 tailles, de 375×812 à 2560×1440).
  ADR-024. Vérifié : lint, types, 75 tests unitaires, build, 96 tests de bout en bout.

- 23/11/2026 — **Logo** (demande de l'utilisateur) : logo du kit détouré et affiché à l'identique
  en français ; icône + nom traduit sur deux lignes dans les autres langues (choix de
  l'utilisateur, ADR-023). Vérifié : lint, types, 75 tests unitaires, build, 94 tests de bout en
  bout, contrôle visuel sur ordinateur et mobile (aucun débordement en allemand).

- 23/11/2026 — **Inc-2 terminé** : connexion sans mot de passe (code à 6 chiffres par e-mail,
  lien de secours, Google derrière `GOOGLE_AUTH_ENABLED`), étape « Comment t'appelles-tu ? »,
  espace compte (profil, déconnexion, suppression avec mot de confirmation par langue), langue
  enregistrée dans le compte, e-mail de connexion dans les 5 langues ; migration `profiles` avec
  RLS, privilèges par colonne et déclencheurs ; proxy (session, pages privées). Vérifié : lint,
  types, format, 75 tests unitaires, 17 tests RLS sur Supabase local, build, 92 tests de bout en
  bout sur le build de production (ordinateur + mobile, audit axe sans violation). ADR-022,
  `docs/security.md`. Reste pour plus tard : formule, crédits et achats sur la page compte
  (Inc-3, Inc-6), résiliation Stripe à la suppression (Inc-6), retour aux réponses après
  connexion (Inc-4).
- 23/11/2026 — Inc-1 commité (0d56467, branche `feat/inc-1-vitrine`).

- 23/11/2026 — **Inc-1 terminé (M1)** : accueil, Tarifs (bascule mensuel/annuel, économies
  calculées), pages légales en 5 langues (traductions EN/IT/ES/DE faites en parallèle et
  vérifiées), adresses traduites, métadonnées + hreflang, catalogue unique des offres. Vérifié :
  lint, types, format, 51 tests unitaires, build (45 pages statiques), 70 tests de bout en bout sur
  le build de production (ordinateur + mobile, audit axe sans violation après correction de
  l'accès clavier aux tableaux défilants). ADR-021. Restent pour plus tard : bouton « Créer mon CV »
  fonctionnel (Inc-4), boutons de souscription (Inc-6).
- 23/11/2026 — Inc-0 commité (7e76fa6, branche `feat/inc-0-socle`).
- 23/11/2026 — **Inc-0 terminé (M0)** : Next.js 16.4.6 (Cache Components), TypeScript 6.0.3,
  Tailwind 4.3.5 + shadcn/ui (Base UI) aux couleurs de la charte, Poppins ; 5 langues avec
  next-intl 4.15.3 (`next/root-params`, proxy, sélecteur, 404 et erreurs traduites) ; Supabase
  local dans Docker (≈ 650 Mo de mémoire) ; CI GitHub Actions. Vérifié : lint, types, format,
  16 tests unitaires, build, 22 tests de bout en bout (ordinateur + mobile, build de production,
  audit axe sans violation). Dépôt Git initialisé, **rien n'est encore commité**. ADR-020.
- 23/11/2026 — Multilingue ajouté à la demande de l'utilisateur : 5 langues dès le lancement,
  langue du CV au choix, nom de marque traduit (ADR-018, ADR-019) ; US-41 et US-42 ajoutées
  (42 stories) ; architecture, données, design et risques (R19–R21) mis à jour ; Inc-0 passe à L.
- 23/11/2026 — Phase 3 terminée : architecture (Next.js 16.4, Supabase, Stripe, Claude Opus 5.5),
  contrats d'actions et flux, modèle de données (10 tables, RLS, fonctions de crédits), design
  system (contrastes AA vérifiés) et wireframes ; ADR-009 à 016. Rétention des comptes inactifs :
  3 ans (choix de l'utilisateur, ADR-017, US-40 ajoutée → 40 stories).
- 23/11/2026 — Phase 2 terminée : jalons M0–M6, chemin critique, registre des risques.
- 23/11/2026 — Phase 1 terminée : 4 personas, 39 user stories (MVP : 26, V1 : 13), matrice des
  droits, 8 exigences non fonctionnelles, traçabilité complète ; règles H18–H27 (ADR-008) ;
  retrait des pubs déplacé en Inc-11.
- 23/11/2026 — Développement local sur Docker Desktop (déjà démarré) : Supabase et CLI Stripe en
  conteneurs, Next.js sur la machine avec Node.js 24 (ADR-007). Tâche manuelle 1 faite.
- 23/11/2026 — Questions Q1 à Q6 posées et tranchées par l'utilisateur (ADR-006).
- 23/11/2026 — Cadrage : lecture de l'INTAKE et des kits UI, plan de réalisation rédigé,
  9 contradictions et 17 hypothèses consignées, 6 questions ouvertes.
