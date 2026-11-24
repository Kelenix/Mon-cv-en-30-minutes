# Tâches manuelles — à faire par vous

> Ce que Claude ne peut pas faire à votre place : créer des comptes, accepter des conditions,
> fournir des clés ou des informations légales. Les tâches marquées ⏱ prennent du temps côté
> fournisseur : lancez-les tôt. Les clés ne doivent **jamais** être collées dans le code ni dans le
> chat : elles vont dans le fichier `.env.local` (non versionné), créé à l'Inc-0.

---

## Tâche 1 ✅ : Outils de développement (fait le 23/11/2026)
- **Pourquoi** : lancer l'application en local ; Docker Desktop fait tourner Supabase (base,
  authentification, e-mails de test) et plus tard la CLI Stripe (ADR-007).
- **État constaté** : Node.js 24.16, npm 11.13, Git 2.54, Docker Desktop 29.9.3 démarré.
- **À retenir** : **démarrer Docker Desktop avant chaque session de développement** et avant de
  lancer les tests.
- **Coût** : gratuit (Docker Desktop est gratuit pour un usage personnel ou une petite entreprise ;
  vérifier les conditions de licence).
- **Vérification** : `docker info` répond sans erreur.

## Tâche 2 ✅ : Supabase en ligne (sans objet depuis le 24/11/2026)
- **Remplacée** : la base et l'authentification tournent sur le VPS, avec le site (ADR-038).
  Aucun compte Supabase n'est nécessaire ; leur configuration est dans `deploy/`
  (`docs/deployment.md`).

## Tâche 3 ✅ : Créer une clé API Anthropic (faite le 24/11/2026 ; clé vérifiée, Claude Opus 5.5 disponible)
- **Pourquoi** : génération des CV, lettres, versions LinkedIn et entretiens.
- **Quand** : avant l'Inc-4.
- **Étapes** :
  1. Créer un compte sur https://console.anthropic.com et ajouter un moyen de paiement.
  2. **Fixer une limite de dépenses mensuelle** (Settings → Limits).
  3. Créer une clé API et la placer dans `.env.local` : `ANTHROPIC_API_KEY=...` (le modèle se
     règle avec `ANTHROPIC_MODEL`, `claude-opus-5-5` par défaut). Redémarrer `npm run dev`.
  4. En production, la clé va dans `deploy/.env` sur le serveur (`IP_HASH_SALT` y est généré
     par `generate-secrets.sh`) : sans elle, le site refuse de démarrer.
- **Coût** : à l'usage (voir la question Q4 du plan).
- **Vérification** : un CV généré en local est reformulé (et non plus une simple copie des
  réponses, comme le fait l'IA simulée). La durée et la fidélité ont été mesurées sur 20 profils
  de référence le 24/11/2026 : P95 de 5,9 s, aucun fait inventé (ADR-041). Pour relancer la
  mesure, payante (environ 0,35 $) : `npm run eval:ai`.

## Tâche 4 ⏱ : Ouvrir le compte Stripe
- **Avancement (24/11/2026)** : compte existant « Kelenix Teck » (Italie), déjà activé et partagé
  avec d'autres produits (ADR-042).
  - **Mode test configuré** :
    - clé dans `.env.local` ;
    - produits, prix et portail « moncv » créés ;
    - secret du webhook local ajouté ;
    - achat de test vérifié, crédits ajoutés.
  - **Reste à faire à la mise en ligne (étape 8 de `docs/deployment.md`)** :
    - choisir le libellé bancaire vu par les clients (actuellement « CODECRAFTEUR FORMATION ») :
      « CV30SECONDES.COM » tient dans les 22 caractères permis, mais ce réglage du compte vaut
      aussi pour ses autres produits ;
    - vérifier le réglage des impayés ;
    - en mode réel : produits, webhook et clés.
- **Pourquoi** : vendre crédits, abonnements, CV Pro et retrait des publicités.
- **Quand** : création du compte avant l'Inc-6 (les clés de **test** sont disponibles dès
  l'inscription). L'activation complète (vérification d'identité, plusieurs jours) n'est requise
  qu'avant la mise en production : la lancer tôt quand même.
- **Étapes** :
  1. Créer un compte sur https://stripe.com.
  2. Compléter l'activation : identité, entreprise, compte bancaire de versement.
  3. Rester en **mode test** pendant le développement :
     - **Développeurs → Clés API** : copier la clé secrète de test (`sk_test_…`) dans
       `.env.local` (`STRIPE_SECRET_KEY`), puis lancer `npm run stripe:seed` (produits, prix et
       portail client).
     - **Paramètres → Informations publiques** : renseigner l'adresse des CGV
       (`https://cv30secondes.com/fr/cgv`) ; Stripe l'exige pour faire accepter les conditions au
       paiement.
     - **Paramètres → Facturation → Abonnements** : en cas d'échec de paiement après les
       relances, **annuler l'abonnement**.
     - Webhooks en local : `docker compose --env-file .env.local run --rm stripe listen
       --print-secret` affiche le secret à copier dans `STRIPE_WEBHOOK_SECRET`, puis
       `docker compose --env-file .env.local up stripe` pendant les tests (Docker suffit).
  4. À la mise en production : produits, prix et portail du mode réel avec
     `npm run stripe:seed -- --live`, réglages ci-dessus refaits en mode réel, webhook
     `https://cv30secondes.com/api/stripe/webhook` (avec l'événement `invoice.paid` pour les revenus
     des abonnements) ; clés du mode réel dans `deploy/.env` sur le
     serveur (`docs/deployment.md`, étape 8).
- **Coût** : commission par transaction (environ 1,5 % + 0,25 € par carte UE ; vérifier la grille
  en vigueur).
- **Vérification** : un achat de pack avec la carte de test `4242 4242 4242 4242` crédite le
  compte en local ; le tableau de bord Stripe affiche « Compte activé » avant la mise en
  production.

## Tâche 5 : Créer les identifiants Google OAuth
- **Avancement (24/11/2026)** :
  - Projet Google Cloud `mon-cv-en-30-secondes` créé, avec un écran de consentement externe en
    mode test et un client Web.
  - Identifiants placés dans `supabase/.env` ; Google activé dans `supabase/config.toml` et dans
    `.env.local`.
  - Connexion avec Google réussie en local : compte créé, arrivée sur l'espace attendu.
  - **Reste à faire** : avec le domaine, ajouter les adresses de production, compléter le
    Branding, publier l'application et remplir `deploy/.env` (étape 8 de `docs/deployment.md`).
    D'ici là, seuls les utilisateurs tests déclarés peuvent se connecter avec Google.
- **Pourquoi** : bouton « Continuer avec Google ».
- **Quand** : avant l'Inc-2 pour tester ce bouton en local, sinon avant la mise en production.
  La connexion par e-mail fonctionne en local sans ce compte.
- **Étapes** :
  1. Sur https://console.cloud.google.com, créer un projet (ex. « Mon CV en 30 Secondes »).
  2. **APIs et services → Écran de consentement OAuth** : type **Externe**, nom de l'application,
     e-mail d'assistance, logo facultatif ; champs d'application `openid`, `email` et `profile`
     uniquement.
  3. **Identifiants → Créer des identifiants → ID client OAuth**, type **Application Web** :
     - Origines JavaScript autorisées : `http://localhost:3000`, puis `https://cv30secondes.com`.
     - URI de redirection autorisés : `http://127.0.0.1:54321/auth/v1/callback` (Supabase local),
       puis `https://api.cv30secondes.com/auth/v1/callback` (serveur).
  4. Copier l'ID client et le code secret dans un fichier `supabase/.env` (jamais versionné) :
     `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=…` et `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=…`.
  5. Dans `supabase/config.toml`, section `[auth.external.google]`, passer `enabled = true`, puis
     `npm run db:stop` et `npm run db:start`.
  6. Dans `.env.local`, mettre `GOOGLE_AUTH_ENABLED=true` et relancer `npm run dev`.
  7. En production : `GOOGLE_AUTH_ENABLED=true`, `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans
     `deploy/.env`, puis `deploy/scripts/deploy.sh`.
- **Coût** : gratuit.
- **Vérification** : connexion Google réussie en local.

## Tâche 6 : Configurer Resend pour les e-mails
- **Avancement (24/11/2026)** : compte Resend créé. Les étapes 2 à 6 attendent le domaine, qui
  s'achète à l'étape 1 de `docs/deployment.md` (tâche 9) : faire Resend juste après, avant
  `deploy.sh`.
- **Pourquoi** : envoyer les codes de connexion et les avertissements avant suppression des
  comptes inactifs (US-40). Le fournisseur choisi est **Resend**, utilisé en SMTP par
  l'authentification et par le site.
- **Quand** : avant la mise en production, une fois le domaine acheté. Pas nécessaire en
  développement : en local, les e-mails de connexion sont capturés par Mailpit (Supabase local)
  et ceux du site sont seulement journalisés.
- **Étapes** :
  1. Créer un compte sur https://resend.com.
  2. **Domains → Add Domain** : saisir `cv30secondes.com` et choisir la région **Ireland
     (eu-west-1)**, pour un envoi depuis l'Union européenne.
  3. Créer dans la zone DNS du domaine (hPanel → Domaines → DNS) les enregistrements affichés
     par Resend (MX et TXT pour l'envoi, TXT DKIM `resend._domainkey`, DMARC conseillé), puis
     **Verify** et attendre « Verified ». Sans cette étape, les e-mails sont refusés ou finissent
     en indésirables.
  4. **API Keys → Create API Key** : nom « VPS », permission **Sending access**, limitée au
     domaine du site ; copier la clé (`re_…`), elle ne s'affiche qu'une fois.
  5. Dans `deploy/.env` sur le serveur (hôte `smtp.resend.com`, port 465 et identifiant `resend`
     sont déjà remplis) : `SMTP_PASSWORD` = la clé, `SMTP_SENDER_EMAIL` est déjà
     `no-reply@cv30secondes.com`.
  6. `deploy/scripts/deploy.sh`.
- **Coût** : l'offre gratuite permet 3 000 e-mails par mois et **100 par jour au plus** : elle
  suffit pour les essais (mettre alors `AUTH_EMAILS_PER_HOUR=10`), mais au-delà de 100 connexions
  par jour, les codes ne partent plus jusqu'au lendemain. Pour le lancement, l'offre **Pro**
  (environ 20 $/mois pour 50 000 e-mails, à vérifier sur resend.com/pricing) est recommandée,
  avec `AUTH_EMAILS_PER_HOUR=200`.
- **Vérification** : un code de connexion arrive en moins d'une minute, hors indésirables ; il
  apparaît dans Resend → **Emails** avec l'état « Delivered » ; `docker compose logs auth` ne
  montre pas d'erreur SMTP.

## Tâche 7 : Fournir les informations légales du vendeur
- **Avancement (24/11/2026)** : raison sociale, e-mail de contact et prénom du directeur de la
  publication fournis ; hébergeur renseigné. Ces valeurs sont placées dans `.env.local` et
  s'affichent sur les pages légales.
  - **Reste à fournir** :
    - statut juridique (et capital pour une société) ;
    - numéro d'immatriculation (SIRET ou RCS) ;
    - adresse du siège ;
    - nom complet du directeur de la publication ;
    - médiateur de la consommation ;
    - numéro de TVA, s'il y en a un.
  - **Hébergeur** : Hostinger ne publie pas de numéro de téléphone (support par chat). Le demander
    au support, sinon la page de contact sert de moyen de joindre l'hébergeur.
- **Pourquoi** : mentions légales, CGV, politique de confidentialité et factures sont obligatoires
  pour vendre en ligne.
- **Quand** : avant l'Inc-6.
- **Étapes** :
  1. Réunir : raison sociale ou nom, statut juridique, SIRET, adresse, e-mail de contact, numéro de
     TVA s'il y a lieu, directeur de la publication, hébergeur (nom, adresse, téléphone) et
     **médiateur de la consommation** (adhésion obligatoire pour vendre à des particuliers en
     France). Ces valeurs vont dans les variables `LEGAL_*` de `deploy/.env` sur le serveur ; en
     production, le site refuse de démarrer si l'une d'elles manque. Hébergeur :
     Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Chypre, et le
     téléphone indiqué sur hostinger.fr.
  2. Faire relire les CGV et la politique de confidentialité par un juriste avant le lancement,
     **dans chacune des 5 langues** et pour chaque pays où vous vendez (Italie, Espagne,
     Allemagne… ont leurs propres règles de protection du consommateur). Les textes sont dans
     `src/features/legal/content/` ; points déjà signalés par les traducteurs : voir
     `docs/risks.md` (R20).
  3. Vérifier vos obligations de TVA avec un expert-comptable (dont le guichet unique OSS pour les
     clients d'autres pays de l'UE) et décider d'activer ou non Stripe Tax pour le calcul.
- **Coût** : selon le juriste et l'expert-comptable.
- **Vérification** : les pages légales n'affichent plus aucun champ manquant.

## Tâche 8 : Fournir le logo et les illustrations en fichiers séparés (facultatif)
- **Pourquoi** : les kits fournis sont des planches composites dont le fond en damier est incrusté
  dans l'image. Le logo a été détouré du kit web (ADR-023) et s'affiche proprement sur fond
  blanc ; un fichier source (SVG ou PNG transparent) donnerait un contour encore plus net,
  notamment sur les écrans haute définition.
- **Quand** : quand tu le souhaites ; rien n'est bloqué.
- **Étapes** : exporter depuis l'outil de création le logo (SVG de préférence) **dans chacune des
  5 langues** (nom de marque traduit, tâche 12), l'icône 30s et les illustrations (PNG
  transparents, au moins 1 200 px de large) dans un dossier `assets-source/`.
- **Coût** : aucun.
- **Vérification** : les fichiers s'affichent sur fond blanc sans damier.

## Tâche 9 : Mettre le site en ligne sur le VPS Hostinger
- **Pourquoi** : mise en ligne (ADR-038). Tout est prêt dans `deploy/` et a été répété en
  local ; il reste ce qui demande tes comptes et ton serveur.
- **Quand** : maintenant, une fois les tâches 4, 7, 16 et 17 faites (5 et 10 peuvent suivre).
  Le domaine **cv30secondes.com** (ADR-043) s'achète à l'étape 1 ; la tâche 6 (Resend) se termine juste après, avant
  `deploy.sh`.
- **Étapes** : suivre `docs/deployment.md`, étapes 1 à 8 : commander le VPS (Ubuntu 24.04,
  centre de données dans l'UE) et le domaine, clé SSH, `setup-vps.sh`, DNS (`@`, `www`, `api`),
  clé de lecture du dépôt, `deploy/.env`, `deploy.sh`, puis Stripe et Google.
- **Coût** : VPS KVM 2 recommandé (KVM 1 suffit pour démarrer), selon la durée d'engagement ;
  domaine environ 10 à 15 €/an. Vérifier les prix sur hostinger.fr.
- **Vérification** : `deploy.sh` se termine par « Version … en ligne », le site répond en HTTPS
  sur le domaine, la connexion par code fonctionne.

## Tâche 11 ✅ : Créer le dépôt GitHub (dépôt relié le 23/11/2026 ; CI à vérifier au prochain envoi)
- **Pourquoi** : héberger le code et faire tourner l'intégration continue (GitHub Actions) ; le
  serveur récupère le code depuis ce dépôt. Envoyer `main` avant la mise en ligne
  (`git push origin main`).
- **Quand** : pendant l'Inc-0, pour voir la CI au vert. En attendant, les mêmes vérifications
  tournent en local.
- **Étapes** :
  1. Sur https://github.com → **New repository**, visibilité **Private**, sans README ni
     `.gitignore` (ils sont fournis par le projet).
  2. Me donner l'adresse du dépôt : je le relie au projet local (je ne pousse rien sans ton
     accord).
- **Coût** : gratuit (les minutes de GitHub Actions incluses suffisent pour ce projet).
- **Vérification** : l'onglet **Actions** du dépôt affiche un passage vert après le premier envoi.

## Tâche 12 : Valider les noms de marque et faire relire les traductions
- **Pourquoi** : le nom de marque change selon la langue (ADR-018) et les textes doivent sonner
  naturels pour des locuteurs natifs.
- **Quand** : noms de marque avant l'Inc-1 (ils apparaissent sur l'accueil) ; relecture des
  textes à la fin de chaque jalon (M1, M3, M4, M6).
- **Étapes** :
  1. Valider ou corriger les noms proposés : FR « Mon CV en 30 Secondes », EN « My CV in 30
     Seconds », IT « Curriculum in 30 Secondi », ES « Mi CV en 30 Segundos », DE « Mein Lebenslauf
     in 30 Sekunden ».
  2. Vérifier leur disponibilité (marque, nom de domaine) si vous comptez les protéger.
  3. Faire relire `messages/en.json`, `it.json`, `es.json` et `de.json` par un locuteur natif.
- **Coût** : selon les relecteurs ; dépôt de marque éventuel.
- **Vérification** : les noms validés sont reportés dans `docs/product/user-stories.md` (H31) ;
  chaque relecture est notée dans `PROJECT_STATE.md`.

## Tâche 10 ⏱ : Comptes publicitaires (AdSense / Ad Manager)
- **Pourquoi** : bannière, publicité native, interstitiel et vidéo récompensée.
- **Quand** : une fois le site en ligne (l'approbation exige un site public).
- **Étapes** :
  1. Créer un compte **Google AdSense** avec l'adresse du site en ligne et attendre son
     approbation ; noter l'**identifiant d'éditeur** (`pub-…`, menu Compte → Informations).
  2. Ouvrir **Google Ad Manager** (offre gratuite, liée au compte AdSense) ; noter le **code
     réseau** (Administration → Paramètres globaux).
  3. Dans Ad Manager, **Inventaire → Blocs d'annonces**, créer exactement : `mon-cv-banniere`
     (tailles 728 × 90 et 320 × 50), `mon-cv-native` (taille « fluide », format natif),
     `mon-cv-interstitiel` (format hors page : interstitiel web) et
     `mon-cv-video-recompensee` (format hors page : récompensé web, 1 récompense).
  4. Dans AdSense ou Ad Manager, **Confidentialité et messages → Message RGPD** : bouton
     « Refuser » activé (au même niveau qu'« Accepter »), langues FR, EN, IT, ES, DE, lien vers
     la page Cookies du site, durée du choix de **6 mois** si l'option existe ; publier le message.
  5. Dans `deploy/.env` sur le serveur : `ADS_MODE=google`, `ADS_PUBLISHER_ID=pub-…`,
     `ADS_NETWORK_CODE=…` et, pour vendre le retrait des publicités, `ADS_REMOVAL_ENABLED=true` ;
     puis `deploy/scripts/deploy.sh`.
  6. Vérifier que `https://cv30secondes.com/ads.txt` affiche la ligne `google.com, pub-…`.
- **Coût** : gratuit (rémunération par Google).
- **Vérification** : bandeau de Google à la première visite (Accepter / Refuser), annonces en
  bas de l'accueil et dans « Mes CV » sans abonnement, aucune annonce avec un abonnement,
  vidéo récompensée qui crédite 1 crédit, interstitiel une seule fois en quittant l'aperçu du
  premier CV, « Gérer les cookies » qui rouvre le choix.

## Tâche 13 : Déclarer le site aux moteurs de recherche
- **Pourquoi** : faire connaître le plan du site à Google et Bing et suivre le référencement
  (US-39).
- **Quand** : une fois le site en ligne sur son domaine (tâche 9).
- **Étapes** :
  1. Ouvrir **Google Search Console**, ajouter une propriété de type « Domaine » avec le domaine
     du site et la valider par l'enregistrement DNS (TXT) indiqué.
  2. Menu **Sitemaps** : saisir `sitemap.xml` et valider.
  3. Dans **Bing Webmaster Tools**, importer le site depuis Google Search Console.
- **Coût** : gratuit.
- **Vérification** : le sitemap apparaît « Réussi » avec 30 adresses (6 pages dans 5 langues) ;
  dans les jours qui suivent, l'accueil et les tarifs apparaissent dans « Pages » comme indexés.

## Tâche 14 : Activer le déploiement automatique
- **Pourquoi** : chaque envoi sur `main` dont la CI est verte est mis en ligne sans commande
  (`.github/workflows/deploy.yml`), avec retour automatique en cas d'échec.
- **Quand** : après la première mise en ligne (tâche 9). Facultatif : `deploy/scripts/deploy.sh`
  sur le serveur fait la même chose à la main.
- **Étapes** : `docs/deployment.md`, étape 9 (clé SSH limitée au déploiement, environnement
  GitHub `production` avec `VPS_HOST`, `VPS_SSH_KEY` et `VPS_KNOWN_HOSTS`, variable
  `DEPLOY_ENABLED=true`).
- **Coût** : gratuit.
- **Vérification** : onglet **Actions**, « Déploiement » lancé à la main sur `main` : vert, et le
  journal se termine par « Version … en ligne ».

## Tâche 15 : Surveillance et sauvegardes hors du serveur
- **Pourquoi** : être prévenu si le site tombe, et ne pas perdre les données si le VPS est perdu
  (les sauvegardes de la nuit restent sur le serveur).
- **Quand** : dès la mise en ligne.
- **Étapes** :
  1. Créer une sonde gratuite (ex. UptimeRobot) sur `https://cv30secondes.com/api/health`, avec alerte
     par e-mail.
  2. Activer les sauvegardes automatiques du VPS dans hPanel.
  3. Une fois par semaine, copier la dernière sauvegarde dans un dossier chiffré de ton
     ordinateur (`docs/deployment.md` §14).
- **Coût** : gratuit, ou option de sauvegarde Hostinger selon la formule.
- **Vérification** : la sonde est « Up » ; une sauvegarde de moins de 8 jours existe hors du
  serveur.

## Tâche 16 : Créer les clés Cloudflare Turnstile (protection contre les robots)
- **Pourquoi** : chaque demande de code de connexion passe une vérification anti-robot, le plus
  souvent invisible (ADR-039). Elle empêche l'envoi massif d'e-mails (qui viderait le quota
  Resend et bloquerait les vraies connexions) et la création de comptes en série pour profiter
  du CV gratuit (coût de l'IA).
- **Quand** : avant la mise en production ; sans ces clés, le site refuse de démarrer.
- **Étapes** :
  1. Créer un compte gratuit sur https://dash.cloudflare.com (le domaine n'a pas besoin d'être
     géré par Cloudflare).
  2. **Turnstile → Add widget** : nom « Mon CV en 30 Secondes », nom d'hôte : `cv30secondes.com`
     (ajouter aussi `localhost` pour des essais), mode **Managed**, réponse à la question de
     pré-autorisation : **No**.
  3. Copier la **Site Key** dans `TURNSTILE_SITE_KEY` et la **Secret Key** dans
     `TURNSTILE_SECRET_KEY` (`deploy/.env` sur le serveur), puis `deploy/scripts/deploy.sh`.
- **Coût** : gratuit.
- **Vérification** : sur la page de connexion, le bouton « Recevoir un code » s'active après une
  seconde environ et le code arrive ; Cloudflare → Turnstile → Analytics compte les vérifications.

## Tâche 17 : Déclarer les administrateurs
- **Pourquoi** : l'espace d'administration (`https://cv30secondes.com/admin`, ADR-040) n'est ouvert
  qu'aux adresses déclarées sur le serveur.
- **Quand** : à la mise en ligne.
- **Étapes** :
  1. Dans `deploy/.env` : `ADMIN_EMAILS=ton-adresse@exemple.fr` (plusieurs adresses séparées
     par des virgules), puis `deploy/scripts/deploy.sh`.
  2. Te connecter sur le site avec cette adresse (code reçu par e-mail), puis ouvrir `/admin`.
  3. Activer la double authentification sur cette boîte e-mail : elle donne accès à
     l'administration.
- **Coût** : gratuit.
- **Vérification** : `/admin` affiche la vue d'ensemble ; avec un autre compte, la page est
  introuvable.
