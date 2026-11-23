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

## Tâche 2 : Créer le projet Supabase en ligne
- **Pourquoi** : base de données et authentification du site en production. En développement,
  Supabase tourne en local dans Docker Desktop : aucun compte n'est nécessaire.
- **Quand** : avant la mise en production (Inc-13).
- **Étapes** :
  1. Créer un compte sur https://supabase.com puis **New project**.
  2. Choisir une **région européenne** (ex. Paris ou Francfort).
  3. Noter le mot de passe de la base dans votre gestionnaire de mots de passe.
  4. Un pas-à-pas fourni à l'Inc-13 expliquera où reporter les clés (variables Vercel) et la
     configuration de l'authentification, à reprendre de `supabase/config.toml` : adresses de
     retour `https://<domaine>/auth/**`, modèle d'e-mail `supabase/templates/sign-in-code.html`
     (« Confirm signup » et « Magic Link ») et son objet, code à 6 chiffres. La commande
     `npx supabase config push` peut envoyer cette configuration au projet en ligne.
- **Coût** : plan Pro (environ 25 $/mois) au lancement, car le plan Free se met en pause après
  7 jours d'inactivité.
- **Vérification** : le site en ligne se connecte à la base (Inc-13).

## Tâche 3 : Créer une clé API Anthropic
- **Pourquoi** : génération des CV, lettres, versions LinkedIn et entretiens.
- **Quand** : avant l'Inc-4.
- **Étapes** :
  1. Créer un compte sur https://console.anthropic.com et ajouter un moyen de paiement.
  2. **Fixer une limite de dépenses mensuelle** (Settings → Limits).
  3. Créer une clé API et la placer dans `.env.local` : `ANTHROPIC_API_KEY=...` (le modèle se
     règle avec `ANTHROPIC_MODEL`, `claude-opus-5-5` par défaut). Redémarrer `npm run dev`.
  4. En production, ajouter aussi `IP_HASH_SALT` (32 caractères minimum, ex.
     `openssl rand -hex 32`) : sans ces deux variables, le site refuse de démarrer.
- **Coût** : à l'usage (voir la question Q4 du plan).
- **Vérification** : un CV généré en local est reformulé (et non plus une simple copie des
  réponses, comme le fait l'IA simulée) ; je mesurerai alors la durée et la fidélité sur 20
  profils de référence (US-11 c.4 et c.5).

## Tâche 4 ⏱ : Ouvrir le compte Stripe
- **Pourquoi** : vendre crédits, abonnements, CV Pro et retrait des publicités.
- **Quand** : création du compte avant l'Inc-6 (les clés de **test** sont disponibles dès
  l'inscription). L'activation complète (vérification d'identité, plusieurs jours) n'est requise
  qu'avant la mise en production : la lancer tôt quand même.
- **Étapes** :
  1. Créer un compte sur https://stripe.com.
  2. Compléter l'activation : identité, entreprise, compte bancaire de versement.
  3. Rester en **mode test** pendant le développement. Les produits et les prix seront créés par un
     script fourni à l'Inc-6. En local, les webhooks sont relayés par la CLI Stripe lancée dans
     Docker : rien à installer.
- **Coût** : commission par transaction (environ 1,5 % + 0,25 € par carte UE ; vérifier la grille
  en vigueur).
- **Vérification** : le tableau de bord Stripe affiche « Compte activé ».

## Tâche 5 : Créer les identifiants Google OAuth
- **Pourquoi** : bouton « Continuer avec Google ».
- **Quand** : avant l'Inc-2 pour tester ce bouton en local, sinon avant la mise en production.
  La connexion par e-mail fonctionne en local sans ce compte.
- **Étapes** :
  1. Sur https://console.cloud.google.com, créer un projet (ex. « Mon CV en 30 Secondes »).
  2. **APIs et services → Écran de consentement OAuth** : type **Externe**, nom de l'application,
     e-mail d'assistance, logo facultatif ; champs d'application `openid`, `email` et `profile`
     uniquement.
  3. **Identifiants → Créer des identifiants → ID client OAuth**, type **Application Web** :
     - Origines JavaScript autorisées : `http://localhost:3000` (puis le domaine du site à
       l'Inc-13).
     - URI de redirection autorisés : `http://127.0.0.1:54321/auth/v1/callback` (Supabase local)
       et, plus tard, `https://<référence-du-projet>.supabase.co/auth/v1/callback` (tâche 2).
  4. Copier l'ID client et le code secret dans un fichier `supabase/.env` (jamais versionné) :
     `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=…` et `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=…`.
  5. Dans `supabase/config.toml`, section `[auth.external.google]`, passer `enabled = true`, puis
     `npm run db:stop` et `npm run db:start`.
  6. Dans `.env.local`, mettre `GOOGLE_AUTH_ENABLED=true` et relancer `npm run dev`.
- **Coût** : gratuit.
- **Vérification** : connexion Google réussie en local.

## Tâche 6 : Configurer un fournisseur d'e-mails (SMTP)
- **Pourquoi** : le serveur d'e-mails par défaut de Supabase est réservé aux tests et très limité
  en volume ; les e-mails de connexion ne partiraient pas en production. Le même fournisseur
  envoie les avertissements avant suppression des comptes inactifs (US-40).
- **Quand** : avant la mise en production (Inc-13). Pas nécessaire en développement : en local,
  les e-mails sont capturés par Mailpit (inclus dans Supabase local, dans Docker).
- **Étapes** : un pas-à-pas sera fourni à l'Inc-13 (ex. Resend, puis Supabase → Auth → SMTP).
- **Coût** : palier gratuit, puis payant selon le volume.
- **Vérification** : un e-mail de connexion arrive en moins d'une minute.

## Tâche 7 : Fournir les informations légales du vendeur
- **Pourquoi** : mentions légales, CGV, politique de confidentialité et factures sont obligatoires
  pour vendre en ligne.
- **Quand** : avant l'Inc-6.
- **Étapes** :
  1. Réunir : raison sociale ou nom, statut juridique, SIRET, adresse, e-mail de contact, numéro de
     TVA s'il y a lieu, directeur de la publication, hébergeur (nom, adresse, téléphone) et
     **médiateur de la consommation** (adhésion obligatoire pour vendre à des particuliers en
     France). Ces valeurs vont dans les variables `LEGAL_*` décrites dans `.env.example` ; en
     production, le site refuse de se construire si l'une d'elles manque.
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

## Tâche 9 : Créer le projet Vercel et le domaine
- **Pourquoi** : mise en ligne.
- **Quand** : Inc-13.
- **Étapes** : un pas-à-pas sera fourni à l'Inc-13.
- **Coût** : plan Pro (environ 20 $/mois) au lancement, car le plan Hobby interdit l'usage
  commercial ; domaine environ 10 à 15 €/an.
- **Vérification** : le site répond sur le domaine en HTTPS.

## Tâche 11 ✅ : Créer le dépôt GitHub (dépôt relié le 23/11/2026 ; CI à vérifier au prochain envoi)
- **Pourquoi** : héberger le code et faire tourner l'intégration continue (GitHub Actions) ; Vercel
  déploiera depuis ce dépôt.
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
- **Étapes** : un pas-à-pas sera fourni à l'Inc-11.
- **Coût** : gratuit (rémunération par Google).
- **Vérification** : les emplacements affichent des annonces après consentement.
