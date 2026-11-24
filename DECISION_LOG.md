# Journal de décisions (DECISION_LOG)

> ADR léger. Chaque décision structurante prise par Claude **en autonomie** y est consignée :
> contexte → décision → alternatives écartées → conséquences. Permet de tracer et de contester.
> Format inspiré des Architecture Decision Records. Le plus récent en haut.

---

## ADR-044 — VPS partagé : le site derrière le nginx du serveur (tâche 9)

- **Date** : 25/11/2026
- **Statut** : Accepté (choix de l'utilisateur : le VPS KVM 2 existant plutôt qu'un VPS dédié) ;
  modifie la partie HTTPS d'ADR-038
- **Contexte** :
  - Le KVM 2 (Ubuntu 26.04, 2 processeurs, 7,7 Go de mémoire dont 5,6 Go libres) héberge déjà
    deux autres sites. nginx y occupe les ports 80 et 443, avec des certificats certbot, et
    chaque application écoute sur `127.0.0.1`.
  - La procédure d'ADR-038 supposait un VPS dédié, avec Caddy sur les ports 80 et 443 : les
    deux auraient été en conflit.
  - Le serveur n'avait pas de mémoire d'échange, et la connexion SSH par mot de passe y est
    ouverte. Une tâche de nuit d'un autre site supprime les images Docker inutilisées depuis
    plus de 24 heures.
- **Décision** :
  - nginx du serveur devant le site, comme pour les autres : HTTPS de `DOMAIN`, `www` et `api`
    par certbot (renouvelé automatiquement), tout transmis à Caddy sur `127.0.0.1:8180`.
  - Caddy garde son rôle d'aiguillage, en HTTP seulement : site, redirection `www`, API fermée
    sans la clé du serveur, `/api/cron/*` en 404, en-têtes. Il reprend l'adresse du visiteur de
    `X-Real-IP` posé par nginx (`trusted_proxies` limité aux adresses privées, port lié à
    `127.0.0.1`), puis la transmet au site.
  - Le site joint l'API par son adresse publique, via `host-gateway` vers le nginx du serveur
    (certificat valide, sans sortir du VPS). Cela remplace l'alias réseau vers Caddy.
  - `setup-vps.sh DOMAINE [E-MAIL]` installe nginx et certbot, et écrit la configuration du site
    une seule fois. Sur un serveur déjà en service (Docker présent), il ne fait ni mise à jour
    générale, ni changement des règles SSH, et `--no-upgrade` laisse en place les paquets déjà
    installés. Il reste valable pour un VPS neuf : le DNS se fait avant lui.
- **Alternatives écartées** :
  - VPS dédié : procédure déjà testée, mais coût supplémentaire. Pas retenu par l'utilisateur.
  - Supprimer Caddy et tout écrire en nginx : plus de changements, et perte des règles déjà
    testées.
  - Aiguillage TLS par nom de domaine (`ssl_preread`) vers Caddy : il aurait fallu modifier la
    configuration des autres sites.
- **Conséquences** :
  - Préparé le 25/11/2026 : DNS (A et AAAA), certificat de `cv30secondes.com`, `www` et `api`,
    2 Go de mémoire d'échange, dossiers et tâches de la nuit. Les autres sites répondent comme
    avant ; le domaine répond « 502 » jusqu'au premier `deploy.sh`.
  - Plus de HTTP/3 : nginx sert HTTP/1.1 et HTTP/2.
  - Retour arrière rapide limité à 24 heures par la suppression nocturne des images ; au-delà,
    `deploy.sh <commit>` reconstruit la version voulue.
  - Le site partage le serveur, nginx et l'utilisateur `deploy` avec les autres sites
    (`docs/security.md`, risques résiduels). La connexion root par mot de passe reste à fermer
    par l'utilisateur.
  - Les tâches de la nuit échouent, sans conséquence, tant que le code n'est pas sur le serveur.
- **Impact** : technique (moyen), sécurité (moyen : serveur partagé), financier (aucun coût
  ajouté).

---

## ADR-043 — Nom de domaine : cv30secondes.com

- **Date** : 24/11/2026
- **Statut** : Accepté (choix de l'utilisateur sur proposition)
- **Contexte** :
  - Le domaine manquait pour terminer Resend (tâche 6), publier la connexion Google (tâche 5),
    donner l'adresse des CGV à Stripe et mettre le site en ligne (tâche 9).
  - Le site parle 5 langues sous un seul domaine (`/fr`, `/en`, `/it`, `/es`, `/de`), et le nom
    de la marque est traduit dans chacune.
  - Le 24/11/2026, d'après les registres officiels : `cv30secondes.com` est libre, tandis que
    `cv30.com` et `cv30.app` sont pris. `cv30.app` est CV30, une plateforme d'emploi roumaine.
- **Décision** : `cv30secondes.com`, avec l'API sous `api.cv30secondes.com` et les e-mails
  envoyés depuis `no-reply@cv30secondes.com`. Ces valeurs sont préremplies dans
  `deploy/.env.example`, donc dans `deploy/.env` créé par `generate-secrets.sh`.
- **Alternatives écartées** :
  - `cv30s.com`, `cv30sec.com` : trop proches de la marque CV30 ; « 30s » se lit « thirties »
    en anglais.
  - `moncv30.com` : plus court, mais « mon » ne parle qu'aux francophones.
  - Un `.fr` : il fait « site français » auprès des visiteurs des quatre autres langues.
- **Conséquences** :
  - Le domaine est à acheter à l'étape 1 de `docs/deployment.md`, tant qu'il est libre.
  - Aucune recherche de marque déposée n'a été faite : un passage sur TMview avant l'achat est
    prudent.
  - « CV30SECONDES.COM » tient dans le libellé bancaire Stripe (22 caractères), mais ce réglage
    du compte partagé vaut pour tous ses produits (ADR-042).
- **Impact** : métier (marque, faible), technique (aucun : le code lit le domaine dans
  l'environnement).

---

## ADR-042 — Compte Stripe partagé avec d'autres produits (tâche 4)

- **Date** : 24/11/2026
- **Statut** : Accepté (choix de l'utilisateur : compte existant, déjà activé, plutôt qu'un compte
  dédié à activer)
- **Contexte** :
  - Le compte Stripe retenu, « Kelenix Teck » (Italie, nom commercial Kelenix Tech), sert déjà à
    d'autres produits, avec de vrais paiements.
  - Le code supposait un compte réservé à l'application :
    - le script remplaçait le portail client par défaut du compte ;
    - il prenait des clés de prix génériques comme `pro_month` ;
    - le webhook traitait tous les événements, alors qu'un événement d'un autre produit
      déclenchait une erreur 500 et des relances pendant 3 jours, ou ajoutait une facture aux
      revenus de l'administration.
- **Décision** :
  - Marque `moncv` (`STRIPE_APP`) sur les objets de l'application :
    - clés de prix préfixées (`moncv_credits_15`, `moncv_pro_month`…) ;
    - produits et portail client marqués `app: moncv` ;
    - `app: moncv` dans les métadonnées des sessions de paiement.
  - Le script ne crée ou ne modifie que ces objets. Le portail client de l'application est
    distinct, et `openBillingPortal` le désigne explicitement.
  - Le webhook ignore, avec une réponse 200 :
    - une session de paiement sans la marque ;
    - un abonnement ou une facture dont le prix n'a pas le préfixe.
- **Alternatives écartées** :
  - Compte Stripe dédié : il demande une nouvelle activation (identité, IBAN), refusée par
    l'utilisateur. Un compte « Mon CV en 30 Secondes » non activé a été créé puis laissé de côté.
  - Variable d'environnement pour l'identifiant du portail : une étape manuelle de plus.
- **Conséquences** :
  - Le paiement affiche « Kelenix Tech », et le relevé bancaire des clients montre le libellé du
    compte (« CODECRAFTEUR FORMATION ») : à revoir avant la mise en ligne.
  - Les réglages du compte (relances, e-mails) valent pour tous ses produits.
  - Le mode test a été vérifié de bout en bout : achat d'un pack avec la carte 4242, puis
    crédits ajoutés par le webhook.
- **Impact** : financier (moyen : libellé bancaire), technique (faible).

---

## ADR-041 — Mesure de la génération de CV avec l'IA réelle (US-11 c.4 et c.5)

- **Date** : 24/11/2026
- **Statut** : Accepté (mesure payante approuvée par l'utilisateur : 0,72 $ au total, essai d'un
  profil compris)
- **Contexte** : la clé Anthropic est fournie (tâche 3). Il restait à mesurer la durée (< 30 s au
  P95) et la fidélité (aucune entreprise, date, diplôme ou certification absente des réponses ;
  langue demandée) sur 20 profils de référence. Ce jeu n'existait pas encore.
- **Décision** :
  - Jeu de 20 profils dans `tests/eval/reference-profiles.ts` :
    - 10 profils en français, 4 en anglais, 2 en italien, 2 en espagnol, 1 en allemand ;
    - 2 profils avec traduction demandée (français → anglais et anglais → français) ;
    - cas limites : réponses minimales, sans dates, premier emploi, reconversion, profil senior
      long et tentative d'injection.
  - Mesure lancée à la demande par `npm run eval:ai`, jamais en CI car elle est payante. Elle
    effectue des contrôles automatiques : entreprises et établissements présents dans les
    réponses, nombres présents dans les réponses, termes interdits, langue détectée, émojis.
    Le rapport `test-results/ai-eval/cv-generation.json` est ensuite relu à la main.
  - **Premier passage** :
    - P95 de 5,5 s (maximum 8,3 s), 20 générations sur 20 réussies, 0,35 $ ;
    - aucune entreprise, date, diplôme ou certification inventée ; l'injection est ignorée ; la
      langue est respectée 20 fois sur 20.
    - **Défaut trouvé** : 7 CV sur 20 annoncent une durée d'expérience calculée par l'IA, comme
      « plus de 8 ans d'expérience ». Le modèle ne connaît pas la date du jour, donc 2 de ces
      durées étaient fausses (8 ans écrits pour 10 ans réels). Un CV listait aussi « Français »
      sans que la personne ait cité de langue.
  - **Correction** : la règle 1 de la consigne interdit désormais de calculer une durée
    d'expérience à partir des dates. Elle précise aussi que la langue des réponses n'est pas une
    langue déclarée.
  - **Second passage** : P95 de 5,9 s (maximum 7,6 s), 0,35 $, plus aucune durée calculée ni
    langue déduite.
  - Les alertes automatiques restantes sont vérifiées et justes :
    - « Le Wagon », écrit « au Wagon » dans les réponses ;
    - « 03/2021 » pour « mars 2021 » ;
    - « Nursing and Midwifery Council », pour « NMC registered » ;
    - « Kermesse du lycée », reprise de la réponse.
  - **US-11 c.4 et c.5 validés ; R02 clos.** Coût moyen : environ 0,018 $ par CV.
- **Alternatives écartées** :
  - Donner la date du jour au modèle : la consigne devient plus longue, et un calcul fait par
    l'IA reste un chiffre que la personne n'a pas donné.
  - Mesure en CI : coût à chaque modification, et résultats variables d'un passage à l'autre.
- **Conséquences** :
  - Relancer `npm run eval:ai` après tout changement de consigne ou de modèle (`ANTHROPIC_MODEL`).
  - Restent à mesurer avec la clé :
    - les outils IA : fidélité de l'adaptation (US-25 c.3) et de l'amélioration (US-27 c.5) ;
    - les durées des outils, sous 45 s au P95 (NFR-02) ;
    - la qualité de la lettre et de l'entretien.
- **Impact** : fonctionnel (fort : fidélité du CV), financier (faible).

---

## ADR-040 — Espace d'administration (Inc-14)

- **Date** : 24/11/2026
- **Statut** : Accepté (le back-office était « hors de cette version » ; ajouté à la demande de
  l'utilisateur)
- **Décideur** : l'utilisateur (« une dashboard complète ») ; réalisation : Claude (rôles :
  architecte, backend, frontend, sécurité, données)
- **Contexte** : aucun espace pour suivre l'activité, les revenus, l'IA, la provenance des
  visiteurs ni pour agir sur un compte ; seul Supabase Studio (tunnel SSH) donnait accès à la
  base.
- **Décision** :
  - **`/admin`**, en français, hors du routage par langue, avec sa propre mise en page (menu
    latéral, pleine largeur). Accès réservé aux adresses de `ADMIN_EMAILS` : le proxy renvoie
    vers la connexion sans session et affiche une page introuvable aux autres comptes (l'espace
    n'est pas révélé) ; chaque page et chaque action revérifient l'administrateur.
  - **Un administrateur n'a pas d'espace client** : à la connexion, il arrive directement sur
    `/admin` (sans l'étape du prénom) ; « Mon compte » et la première connexion le renvoient au
    tableau de bord ; l'en-tête du site ne lui montre que « Administration ». Son prénom, son nom
    et sa session se gèrent dans la page « Profil » ; « Se déconnecter » est dans le menu de
    l'administration.
  - **Lectures** par six fonctions SQL `admin_*` réservées au rôle serveur (agrégats calculés
    par PostgreSQL, une requête par page) ; aucune table d'administration n'est lisible par les
    visiteurs ou les comptes (RLS sans politique, privilèges retirés).
  - **Pages** : vue d'ensemble (comptes, actifs, abonnés, revenu mensuel récurrent, revenus, CV,
    IA, coût) ; revenus et paiements (par produit, par moyen de paiement, abonnements, économie
    des crédits) ; IA (volume, réussite, durée, coût et tokens par opération, causes d'échec) ;
    provenance (visites par canal, source et pays, pays et langue des comptes, conversion,
    Google ou code) ; utilisateurs (recherche, filtre, fiche détaillée) ; état du système
    (services interrogés en direct, tâches planifiées, sauvegardes, mémoire, disque, tables) ;
    journal. Période au choix : 7, 30, 90 jours ou 12 mois.
  - **Graphiques** : Recharts (aires jour par jour, info-bulle, tableau pour les lecteurs
    d'écran), barres de répartition en HTML ; palette validée pour le daltonisme (bleu, orange,
    vert d'eau), état toujours écrit (icône et libellé).
  - **Actions** : offrir des crédits (achetés, motif), suspendre ou réactiver (bannissement
    GoTrue), supprimer (comme US-06, e-mail à saisir) ; jamais sur son propre compte ; chaque
    action est inscrite au journal (auteur, compte, détail), gardé un an.
  - **Provenance sans traceur** : le proxy compte chaque arrivée sur une page (hors robots et
    préchargements) dans des compteurs par jour, canal (accès direct, recherche, réseaux,
    sites référents, campagne `utm_source`), source et pays ; ni cookie, ni adresse IP, ni lien
    avec un compte ; gardés 25 mois. Pays d'un compte déduit de l'adresse IP à la première
    connexion. Pays par la base DB-IP « IP to Country Lite » (CC BY 4.0, citée), embarquée :
    aucun appel extérieur.
  - **Paiements** : moyen de paiement noté (carte, Apple Pay, Google Pay, PayPal, SEPA…) pour
    les achats et les abonnements ; échéances d'abonnement enregistrées à l'événement Stripe
    `invoice.paid` (à ajouter au webhook) ; revenus et coûts de l'IA gardés anonymes à la
    suppression d'un compte (lien vers le compte mis à vide) pour que l'historique reste juste.
  - **Rétention** : chaque passage est tracé (`job_runs`) pour l'état du système ; les
    sauvegardes de la nuit sont montées en lecture seule dans le conteneur du site.
- **Alternatives écartées** :
  - Outil tiers (Metabase, Grafana, PostHog, Google Analytics) : un service de plus à
    héberger, ou des traceurs soumis au consentement ; pas d'action sur les comptes.
  - Rôle administrateur en base modifiable depuis l'interface : un compte compromis pourrait
    en créer d'autres ; la liste vient de la configuration du serveur.
  - Attribution des inscriptions par cookie (source de chaque compte) : traceur soumis au
    consentement ; seuls des compteurs anonymes sont gardés.
  - Interface traduite en 5 langues : réservée à l'exploitant, francophone.
- **Conséquences** :
  - Politique de confidentialité complétée (5 langues) : pays à la première connexion,
    statistiques anonymes, historique financier anonyme.
  - Ajouter `invoice.paid` aux événements du webhook Stripe et `ADMIN_EMAILS` à `deploy/.env`
    (tâches 4 et 17).
  - L'accès repose sur la connexion par code e-mail : protéger la boîte e-mail de
    l'administrateur (double authentification chez le fournisseur).
- **Impact** : fonctionnel (fort), sécurité (moyen), légal (faible, données anonymes).

---

## ADR-039 — Protection contre les robots à la connexion

- **Date** : 24/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : sécurité, backend, frontend), à la demande de l'utilisateur
- **Contexte** : la demande de code de connexion n'avait ni vérification anti-robot ni plafond
  par adresse IP ; les limites de GoTrue ne voient que l'adresse du serveur du site (tous les
  appels passent par lui, ADR-038). Un robot pouvait vider le quota Resend (100 e-mails par jour
  en offre gratuite), bloquer les vraies connexions, créer des comptes en série pour le CV
  gratuit, ou essayer des codes à la chaîne.
- **Décision** :
  - **Cloudflare Turnstile** sur chaque formulaire qui envoie un code (premier envoi et
    « Renvoyer le code »), en mode `interaction-only` : invisible sauf si Cloudflare demande une
    interaction, aucune image à déchiffrer. Le bouton reste actif (pas de bouton grisé qui
    change d'aspect) : à l'envoi, le formulaire attend le jeton si Cloudflare n'a pas fini (10 s
    au plus). Widget sans hauteur tant qu'il est invisible, marges seulement si une interaction
    s'affiche. Nouveau jeton après chaque réponse (usage unique), message si la vérification
    échoue. Jeton vérifié par le
    serveur auprès de Cloudflare (`siteverify`, 5 s au plus ; refus si absent, invalide ou
    injoignable). Clés obligatoires en production ; sans clé, désactivé (développement et
    tests). CSP : `challenges.cloudflare.com` ajouté aux scripts et aux cadres seulement si la
    clé de site est fournie au build.
  - **Plafonds en base** (`consume_rate_limit`, verrou par clé, compteurs effacés après un
    jour) : 10 demandes de code par heure et par IP ; 30 essais de code par heure et par IP et
    10 par adresse e-mail. IP et e-mail hachés avec le sel secret, jamais stockés en clair.
    Inactifs sans sel (développement et tests).
- **Alternatives écartées** : hCaptcha et reCAPTCHA (images à déchiffrer, traceurs
  publicitaires pour reCAPTCHA) ; CAPTCHA maison (contourné facilement, peu accessible) ;
  plafonds seuls (un robot qui change d'adresse IP passe) ; plafond dans Caddy (module absent de
  l'image officielle, et ne connaît pas l'adresse e-mail) ; plafonds en mémoire (perdus à chaque
  déploiement).
- **Conséquences** : Cloudflare est un sous-traitant de plus, cité dans la politique de
  confidentialité (5 langues) ; tâche manuelle 16. Vérifié dans le navigateur avec les clés de
  test Cloudflare : jeton accepté, jeton refusé, plafond par IP ; aucune erreur de CSP.
- **Impact** : sécurité (fort), coût (protège le quota d'e-mails et le budget de l'IA).

---

## ADR-038 — Hébergement sur un VPS Hostinger et rétention des comptes (Inc-13)

- **Date** : 24/11/2026
- **Statut** : Accepté (remplace l'hébergement Vercel et Supabase Cloud prévu par le plan et
  ADR-009 ; le Vercel Cron d'ADR-014 devient une tâche planifiée du serveur). HTTPS revu par
  ADR-044 : nginx du serveur devant Caddy
- **Décideur** : l'utilisateur (« tout doit être mis en ligne sur un VPS Hostinger ») ;
  réalisation : Claude (rôles : DevOps, sécurité, release, backend)
- **Contexte** : mise en production (Inc-13) sur un seul VPS, sans Vercel ni Supabase Cloud ;
  US-40 (suppression des comptes inactifs) restait à réaliser.
- **Décision** :
  - **Tout dans Docker Compose** (`deploy/docker-compose.yml`) : Caddy (HTTPS Let's Encrypt
    automatique, HTTP/2 et HTTP/3, seul service publié), le site Next.js en serveur autonome
    (`output: "standalone"`), et les services Supabase nécessaires : PostgreSQL avec
    `pg_cron`, authentification (GoTrue), API (PostgREST). Images aux **versions exactes de
    Supabase en local** (CLI 3.2.0), pour que la production se comporte comme les tests.
    Studio et postgres-meta à la demande (profil `admin`), joignables par tunnel SSH seulement.
    Ni stockage, ni temps réel, ni fonctions : le projet ne les utilise pas.
  - **Pas de Kong** : Caddy fait la passerelle. `api.domaine` n'ouvre au navigateur que
    `/auth/v1/authorize`, `/callback` et `/verify` (connexion Google). Le reste exige l'en-tête
    `apikey` du serveur : tous les appels à Supabase partent du serveur du site, donc les clés
    ne quittent jamais le serveur. Le site joint l'API par son adresse publique, via un alias
    réseau Docker vers Caddy, sans sortir du VPS. La base n'est sur aucun réseau du site.
  - **Clés Supabase** : JWT HS256 (`anon`, `service_role`) signées par
    `deploy/scripts/generate-secrets.sh` avec un secret aléatoire.
  - **Image du site construite sur le VPS** : elle ne reçoit au build que des valeurs
    publiques (adresses, publicités, informations légales). Les secrets ne sont donnés qu'au
    démarrage. `APP_ENV=production` (remplace `VERCEL_ENV`) rend les variables de production
    obligatoires, vérifiées dès le démarrage par `src/instrumentation.ts`.
  - **Déploiement** : `deploy/scripts/deploy.sh` (code, image, migrations versionnées
    appliquées une à une en transaction, journal compatible avec la CLI Supabase, nouveau site,
    vérifications, retour automatique à l'image précédente si le site ne démarre pas). GitHub
    Actions le lance après une CI verte sur `main`, par une clé SSH limitée à cette commande ;
    inactif tant que `DEPLOY_ENABLED` n'est pas défini. Retour arrière manuel : `rollback.sh`
    (5 dernières images gardées).
  - **Tâches de la nuit** (cron du serveur) : sauvegarde des données (`pg_dump` données seules,
    14 jours, la structure venant des migrations) ; rétention US-40 par
    `POST /api/cron/retention`, appelé depuis le conteneur du site avec `CRON_SECRET`, adresse
    fermée au public par Caddy.
  - **US-40** : deux fonctions SQL réservées au serveur. La première réserve atomiquement les
    comptes à avertir (3 ans moins 30 jours sans activité, sans abonnement actif) : aucun
    double envoi, même relancée. La seconde liste les comptes avertis depuis 30 jours. E-mail
    dans la langue du compte, envoyé par nodemailer avec le même SMTP que l'authentification
    (Resend, choix de l'utilisateur, région d'envoi dans l'UE) ;
    nouvel essai le lendemain si l'envoi échoue. Suppression mise en commun avec US-06
    (`eraseAccount`). 200 comptes au plus par passage.
  - **Stripe** : `npm run stripe:seed -- --live` crée produits, prix et portail en mode réel ;
    la clé est donnée dans l'environnement, jamais dans `.env.local`.
- **Alternatives écartées** :
  - Supabase Cloud pour la base, VPS pour le site : contraire à la demande ; une dépendance et
    un abonnement de plus.
  - Installation Supabase officielle complète (Kong, stockage, temps réel, journaux, pooler) :
    plus de mémoire et de surface d'attaque pour des services inutilisés.
  - Build en CI et image poussée sur un registre : les valeurs publiques du build devraient
    être dupliquées dans GitHub ; le build sur le VPS lit la même configuration que l'exécution.
  - Coolify, Dokploy ou CapRover : une couche d'administration de plus à maintenir et
    sécuriser, pour un seul site.
  - Sauvegarde physique du volume : arrêt de la base chaque nuit.
- **Conséquences** :
  - Coût d'hébergement réduit à celui du VPS. En contrepartie, l'exploitant gère les mises à
    jour des images, les sauvegardes hors du serveur et la surveillance (`docs/deployment.md`).
  - Répétition complète en local sur Docker Desktop (domaine `localhost`) : 9 migrations, HTTPS,
    8 vérifications vertes, connexion par code reçu par e-mail, profil et compte, Studio,
    avertissement de rétention unique puis suppression, sauvegarde puis restauration, retour
    arrière, retour automatique quand une variable manque.
  - Les migrations doivent rester compatibles avec la version précédente du site : le retour
    arrière ne les défait pas.
  - Mesure Lighthouse à refaire sur le domaine : pas de CDN ; HTTP/2 et HTTP/3, compression
    zstd/gzip par Caddy.
- **Impact** : technique (fort), coût (baisse), exploitation (charge reportée sur l'exploitant).

---

## ADR-037 — Référencement, politique de sécurité du contenu et performance (Inc-12)

- **Date** : 24/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : SEO, sécurité, performance, accessibilité)
- **Contexte** : US-39, audit final US-36 et US-37, NFR-01 (Lighthouse ≥ 90, LCP < 2,5 s
  sur mobile), CSP complète reportée depuis l'Inc-1.
- **Décision** :
  - **Référencement** : titre, description, adresse canonique, `hreflang` (5 langues et
    `x-default`), Open Graph et carte large déclarés par `pageMetadata` ; image de partage par
    langue (`[locale]/opengraph-image.tsx`, 1 200 × 630, produite au build, Poppins, logo
    fourni en français, icône et nom traduit ailleurs). Données structurées schema.org :
    éditeur, site et application gratuite sur l'accueil ; offres (formules, CV Pro, packs) sur
    les tarifs, tirées du catalogue. `robots.txt` (sans `/api/` ni `/auth/`) et `sitemap.xml`
    (accueil, tarifs, pages légales, versions linguistiques). Pages privées en `noindex`
    plutôt que bloquées dans `robots.txt` : un robot doit pouvoir lire la consigne.
  - **`hreflang` à une seule source** : l'en-tête HTTP `Link` de next-intl est désactivé
    (`alternateLinks: false`). Il est déduit de l'hôte de la requête (domaine de
    prévisualisation, port) et contredisait l'adresse canonique.
  - **CSP** : ressources du site seulement, plus Supabase ; `frame-ancestors`, `object-src`
    et `frame-src 'none'` ; `form-action` limité au site, à Supabase et à Google (connexion).
    Le paiement Stripe est ouvert par script, il n'est donc pas concerné. `'unsafe-inline'`
    reste nécessaire pour les scripts : les pages sont générées à l'avance, donc sans nonce.
    En mode `ADS_MODE=google` seulement, `https:` est ajouté aux scripts, images, connexions
    et cadres : Ad Manager et son bandeau de consentement chargent des domaines nombreux et
    changeants.
  - **Performance** : l'illustration de l'accueil déclare sa vraie largeur sur mobile (57 Ko au
    lieu de 106 Ko) ; seul le sous-ensemble « latin » de Poppins est préchargé (4 fichiers au
    lieu de 8, il couvre les 5 langues). Les autres sous-ensembles restent déclarés.
  - **Audit** : `tests/e2e/audit.spec.ts` vérifie 17 pages publiques et privées à 1 440,
    1 024, 768 et 375 px : aucun défilement horizontal, champs ≥ 16 px et zones tactiles
    ≥ 44 px sur mobile, axe sans violation, aucune ressource refusée par la CSP. Correctif
    trouvé : les tableaux défilants sont `relative`, pour que les textes réservés aux
    lecteurs d'écran ne fassent plus déborder la page.
- **Alternatives écartées** :
  - CSP à nonce : rendrait chaque page dynamique et perdrait la génération à l'avance.
  - CSS intégré à la page (`inlineCss`) : mesuré moins bon (document de 29 à 77 Ko, premier
    affichage de 0,9 à 1,1 s).
  - Menus de l'en-tête chargés à la demande : boutons qui apparaissent après coup
    (transition brusque, ADR-035).
- **Conséquences** :
  - Lighthouse mobile en local (serveur de production, médiane de 5 passages) : accueil 90,
    tarifs 91 en performance ; 100 en accessibilité, bonnes pratiques et SEO. LCP observé
    0,2 s ; LCP simulé 3,5 à 3,7 s, dû au JavaScript de React et de Next.js transporté en
    HTTP/1.1 par le serveur local.
  - Mesure à refaire sur le domaine de production (HTTP/2, Brotli, CDN) à l'Inc-13.
  - `'unsafe-inline'` laisse passer un script injecté si une faille XSS existait : risque
    résiduel faible, car React échappe tout contenu et aucune donnée saisie n'est insérée en
    HTML brut (données structurées issues du catalogue, `<` échappé).
- **Impact** : technique et sécurité (moyen), métier (acquisition par les moteurs de recherche).

---

## ADR-036 — Publicités, consentement et vidéo récompensée (Inc-11)

- **Date** : 24/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : architecte, backend, frontend, sécurité, juridique)
- **Contexte** : US-24, US-32 à US-35, H15, H26 ; aucun compte Google possible avant la mise en
  ligne (tâche manuelle 10).
- **Décision** :
  - **Google Ad Manager** (bibliothèque GPT) pour tous les formats : seul à proposer sur le web la
    vidéo récompensée et l'interstitiel au format Google (AdSense seul ne le permet pas).
  - **Consentement : « Confidentialité et messages » de Google**, gratuit et certifié (TCF),
    chargé avant GPT ; « Refuser » au même niveau qu'« Accepter » ; refus : annonces non
    personnalisées sans cookie. « Gérer les cookies » dans le pied de page rouvre le choix.
  - **Trois modes** (`ADS_MODE`) : `off` (défaut), `simulation` (annonces, bandeau, vidéo et
    interstitiel de test, sans aucun script externe : développement et tests de bout en bout),
    `google`.
  - **Audience décidée par le serveur** : bannières et natives sans abonnement ni retrait (aucun
    script sinon) ; vidéo récompensée pour tout compte sans abonnement (H26) ; interstitiel une
    seule fois par compte. Emplacements : bas de l'accueil, « Mes CV » (native sous les cartes et
    bannière) ; jamais sur les questions, la génération, l'aperçu, l'export ni le paiement.
    Hauteur réservée (aucun décalage).
  - **Interstitiel** : format officiel d'Ad Manager, déclenché en quittant l'aperçu par un lien ;
    les onglets du CV portent `data-google-interstitial="false"`. Noté comme vu dès qu'il est
    chargé. En simulation, le premier lien qui quitte le CV ouvre l'annonce de test.
  - **Vidéo récompensée** : jeton à usage unique émis par le serveur, échangé à la fin contre
    1 crédit acheté ; refusé avant 5 secondes, après 15 minutes, au-delà de 3 par jour (24 h
    glissantes) ; au plus 30 jetons demandés par jour. Google ne permet pas sur le web de
    vérifier côté serveur qu'une annonce a été vue : le risque (3 crédits par jour et par compte)
    est accepté.
  - **Retrait des publicités** (2,99 €) : vendu seulement si les publicités et
    `ADS_REMOVAL_ENABLED` sont actifs (Tarifs et Crédits), une fois par compte ; livré par le
    webhook existant ; la vidéo récompensée reste proposée.
  - `/ads.txt` servi à partir de l'identifiant d'éditeur.
- **Alternatives écartées** : outil de consentement payant (Didomi, Axeptio, Cookiebot) : coût
  sans nécessité ; bandeau maison : non certifié par Google ; interstitiel maison avec une
  bannière : contraire aux règles de Google.
- **À vérifier avec les vrais comptes** (tâche 10) : affichage de l'interstitiel lors d'une
  navigation interne, durée de conservation du choix (6 mois annoncés), contenus du bandeau dans
  les 5 langues.
- **Impact** : financier / juridique (moyen)

---

## ADR-035 — Transitions fluides entre les pages

- **Date** : 24/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : ui-designer, frontend-engineer), à la demande de l'utilisateur
- **Contexte** : « trop de transitions brusques ». Images prises toutes les 50 ms : en changeant
  d'onglet, toute la page (onglets compris) était remplacée pendant ~340 ms par des barres
  grises sans rapport avec la page d'arrivée, puis le contenu s'affichait d'un coup ; même chose
  sur le compte.
- **Décision** :
  - Transitions de vue natives de React 19.3 (`<ViewTransition>`, sans réglage de Next 16) :
    fondu du contenu entre deux pages, en-tête immobile.
  - **Limitées aux navigations par lien** (type `nav` posé par notre `Link`) : une première
    version animait aussi chaque action de formulaire, ce qui retardait leurs mises à jour pendant
    l'animation (tests instables) ; elle a été écartée.
  - Arrivée du contenu chargé en fondu (`Appear`), titres hors chargement, onglets du CV dans
    une mise en page commune (`/cv/[id]/layout.tsx`, onglet actif lu dans l'adresse).
  - Squelettes à la forme de la page, visibles seulement après 700 ms (React garde un chargement
    au moins 300 ms : un délai plus court les faisait clignoter juste avant le contenu).
  - Mouvement réduit respecté (aucune animation).
- **Alternatives écartées** : bibliothèque d'animation (poids, code en plus) ; squelettes
  immédiats (clignotement) ; glissements latéraux (inutiles pour des onglets).
- **Impact** : visuel (fort), fonctionnel (aucun)

---

## ADR-034 — Historique des CV (Inc-10)

- **Date** : 24/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : backend-engineer, frontend-engineer, ui-designer)
- **Contexte** : US-31, H12, H22 ; la liste « Mes CV » et le remplacement d'un CV existaient
  depuis l'Inc-4.
- **Décision** :
  - **« Mes CV » en deux colonnes** : cartes à gauche (titre sur deux lignes au plus, date de
    modification, langue, Ouvrir, Supprimer), panneau « Ton historique » à droite : nombre de CV,
    règle de la formule (illimité ; 1 CV et choix du CV remplacé ; ou « tu gardes tous tes CV »
    après une descente de formule), lien vers les offres. Vide : « Crée ton premier CV » et la
    colonne de la marque.
  - **Affichage par 12**, « Afficher plus de CV (n sur total) » par un lien `?page=` (sans
    JavaScript, 50 pages au plus).
  - **Suppression après confirmation** (`deleteCv`, sous la RLS) : le CV et ses contenus
    générés partent (cascade) ; un achat CV Pro reste dans l'historique des achats, la fenêtre
    prévient que le déblocage sera perdu.
  - **Corrigé** : un ancien abonné Pro qui garde plus de CV que sa nouvelle formule ne pouvait
    plus en créer (le remplacement restait au-dessus du plafond, la fenêtre « Remplacer un CV »
    revenait sans fin). Un remplacement ne fait jamais grossir l'historique : il passe désormais
    quel que soit le plafond (`complete_cv_generation`, migration `cv_history`).
  - Bannière et publicité native de la liste : à l'Inc-11.
- **Impact** : fonctionnel (moyen)

---

## ADR-033 — Tous les écrans en pleine largeur

- **Date** : 24/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : ui-designer, frontend-engineer), à la demande de l'utilisateur
- **Contexte** : l'utilisateur refuse tout écran à colonne étroite entourée de vide (accueil,
  « Mes CV », outils du CV, puis l'assistant de création) ; la règle du design system exemptait
  encore les formulaires courts.
- **Décision** :
  - **Assistant de création** : question à gauche ; à droite, l'exemple de réponse toujours
    visible et le récapitulatif des 5 réponses (cliquable pour revenir à une question).
  - **Connexion, bienvenue, génération, page introuvable, erreur, CV introuvable** : contenu à
    gauche, colonne de la marque à droite (`BrandAside` : illustration officielle et atouts déjà
    rédigés pour l'accueil), masquée sur mobile.
  - **Compte** : informations à gauche ; formule et crédits, déconnexion et zone sensible à
    droite, en cartes. **Crédits et formule** : formule et soldes côte à côte.
  - **Pages légales** : sommaire fixe à gauche, texte sur toute la largeur restante.
  - Règle du design system (§4) étendue à tous les écrans ; seules exceptions : fenêtres de
    dialogue et feuille du CV.
- **Alternatives écartées** : colonne étroite centrée (convention des formulaires de connexion),
  refusée par l'utilisateur ; texte légal limité à 75 caractères par ligne (laisse un vide à
  droite).
- **Impact** : fonctionnel (faible), visuel (fort)

---

## ADR-032 — Simulation d'entretien (Inc-9)

- **Date** : 24/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : ai-engineer, backend-engineer, frontend-engineer,
  security-engineer)
- **Contexte** : US-30 ; IA toujours simulée (clé Anthropic absente).
- **Décision** :
  - **Onglet « Entretien »** (`/cv/[id]/entretien`, chemin traduit) : poste visé obligatoire et
    langue au choix, « Lancer la simulation — 2 crédits » ; 8 questions adaptées au CV et au poste
    (exactement 8, sinon sortie invalide et crédits rendus).
  - **Les 8 questions sont listées, chacune avec son champ de réponse** (et non en accordéon comme
    prévu dans `flows.md`) : tout est visible, sans clic d'ouverture ; même disposition en deux
    colonnes que les autres outils. Les réponses en cours restent dans la page (une par
    simulation) et le navigateur prévient avant de la quitter ; elles ne sont enregistrées qu'avec
    le retour.
  - **Retour gratuit, journalisé** : opération `interview_feedback` de coût nul
    (`begin_ai_operation` accepte désormais un coût de 0 : rejeu, limite par minute et coûts de
    l'appel comme les autres). Un retour par question répondue (points forts, à améliorer,
    exemple de réponse fondé sur le CV et la réponse, tutoiement) ; un retour incomplet est
    refusé et peut être redemandé, sans débit.
  - **Un seul retour par simulation** : `complete_interview_feedback` enregistre réponses
    (`input`, écrit par le serveur seul) et retour (`output`) en une transaction, `CONFLICT`
    ensuite. Empêche de rejouer gratuitement l'IA sur une même simulation.
  - **Correction directe limitée à LinkedIn et à la lettre** (RLS) : accroches, adaptation et
    entretien restent tels que produits, puisque le serveur les relit.
  - Message d'échec propre au retour (« Rien n'a été débité ») : `useAiTool` accepte des textes
    d'erreur sur mesure.
- **Corrigé en passant** : le test « lisible sur mobile » comptait les onglets masqués dans la
  barre d'onglets qui défile ; il ne mesure plus que la barre elle-même.
- **Reporté** : qualité réelle des questions et des retours (jeu de référence) et durées (NFR-02)
  avec la clé Anthropic.
- **Impact** : fonctionnel / financier (moyen)

---

## ADR-031 — Version LinkedIn et lettre de motivation (Inc-8)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : ai-engineer, backend-engineer, frontend-engineer,
  security-engineer)
- **Contexte** : US-28, US-29, H20, H21 ; IA toujours simulée (clé Anthropic absente).
- **Décision** :
  - **Deux onglets du CV** : « LinkedIn » (`/cv/[id]/linkedin`) et « Lettre de motivation »
    (`/cv/[id]/lettre`, chemin traduit), sur le modèle de « Adapter à une offre ».
  - **LinkedIn** : l'IA renvoie le titre, la section Infos et une description par expérience,
    désignée par son identifiant ; le serveur reconstruit le résultat à partir du CV
    (`linkedinFromAi`) : une entrée par expérience du CV, poste et entreprise repris du CV,
    expérience inventée écartée, description oubliée remplacée par les puces du CV, limites de
    LinkedIn appliquées (220, 2 600, 2 000 caractères). Première personne, sans hashtag ni emoji.
  - **Lettre** : poste obligatoire (2 à 120 caractères), entreprise et annonce facultatives ;
    250 à 400 mots demandés à l'IA, sans en-tête d'adresse ni date ni champ à compléter, signée du
    nom du CV ; le nombre de mots est affiché sans être imposé (l'utilisateur peut raccourcir).
  - **Langue au choix** pour les deux (défaut : langue du CV, US-42 c.4).
  - **Modifiable et conservé (H20, H21)** : chaque version est enregistrée dans `generations` ;
    les corrections partent automatiquement (`updateGeneratedContent`, gratuite), revalidées
    par le serveur avec le schéma du type (seuls LinkedIn et lettre sont modifiables). Les
    5 dernières versions restent consultables ; changer de version envoie d'abord la correction
    en attente.
  - **Copie bloc par bloc** : un bouton « Copier » par texte, dont le nom accessible précise le
    bloc et contient le texte affiché (WCAG 2.5.3).
  - Essential : la lettre se paie en crédits achetés (US-09 c.2), LinkedIn aussi en crédits
    inclus, selon la matrice.
- **Mise en page en pleine largeur** (demande de l'utilisateur) : plus aucune colonne étroite
  centrée dans les pages du CV. Onglets et outils occupent toute la largeur ; sur ordinateur,
  formulaire et versions à gauche (2/5), résultat à droite (3/5) avec un état vide explicite
  (`ToolLayout`) ; l'aperçu du CV remplit la colonne principale et la colonne des offres
  disparaît quand il n'y a rien à proposer. Règle ajoutée au design system (§4).
- **Corrigé en passant** : l'historique de « Adapter à une offre » débordait sur mobile (texte sur
  une ligne) ; les intitulés passent désormais à la ligne (2 lignes au plus) ; « 10 000 » ne se
  coupe plus en fin de ligne.
- **Reporté** : qualité réelle des textes et durées (NFR-02) avec la clé Anthropic.
- **Impact** : fonctionnel (moyen)

---

## ADR-030 — Choix de réalisation des outils d'amélioration par l'IA (Inc-7)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : ai-engineer, backend-engineer, frontend-engineer,
  security-engineer)
- **Contexte** : US-25, US-26, US-27, US-09 ; IA toujours simulée (clé Anthropic absente).
- **Décision** :
  - **Appel à Claude mis en commun** (`features/ai/claude.ts`) : flux, effort `low`, sortie
    structurée, repli, motif d'arrêt, coûts ; la génération du CV l'utilise aussi.
  - **Opération payante commune** (`features/ai/operation.ts`) : coût et crédits utilisables selon
    la matrice, débit sous verrou, IA, puis fonction SQL `complete_ai_operation` (contenu conservé
    avec le CV dans la même transaction, H20) ou remboursement. Une demande rejouée n'est jamais
    relancée (`RATE_LIMITED`, ou `AI_UNAVAILABLE` si elle avait échoué).
  - **Aucune fonction n'est fermée** : la matrice permet tout avec des crédits achetés ; le
    « cadenas » prend la forme de la fenêtre « Solde insuffisant », qui précise pour Essential que
    la fonction se paie en crédits achetés (US-09 c.2), et de « Enregistrer comme nouveau CV »,
    réservé à Pro et Premium (`FORBIDDEN` côté serveur).
  - **Améliorer une expérience** : seules les puces sont réécrites (poste, entreprise et dates
    intacts) ; bouton absent sans mission décrite (l'IA inventerait) ; rien n'est conservé, la
    proposition est appliquée ou non au CV.
  - **Accroche** : 3 ou 5 variantes selon la formule, conservées et consultables depuis le CV.
  - **Adaptation** : l'IA désigne les expériences par leur identifiant ; le serveur reconstruit le
    CV à partir de l'original (`mergeAdaptation`) : aucune expérience, compétence ou formation
    nouvelle, quoi que renvoie l'IA, même sous l'effet d'une consigne cachée dans l'annonce
    (US-27 c.3, c.5) ; mots-clés manquants sans ceux déjà présents. Langue au choix (US-42 c.4) ;
    l'appliquer change aussi la langue du CV ; un nouveau CV reçoit le titre « … — adapté ».
  - **Onglets du CV** : « Aperçu » et « Adapter à une offre » (`/cv/[id]/adapter`), pour accueillir
    LinkedIn, lettre et entretien (Inc-8, Inc-9).
  - Outils inactifs tant qu'une modification n'est pas enregistrée (l'IA lit le CV enregistré).
  - Fenêtre « Solde insuffisant » commune à la génération et aux outils ; un achat lancé depuis un
    CV y ramène.
- **Reporté** : mesure de la fidélité (US-25 c.3) et des durées (NFR-02) sur le jeu de référence,
  et test d'injection avec le vrai modèle (US-27 c.5), dès que la clé Anthropic est fournie.
- **Impact** : fonctionnel / financier (moyen)

---

## ADR-029 — Choix de réalisation des paiements (Inc-6)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : backend-engineer, database-architect, security-engineer,
  frontend-engineer)
- **Contexte** : US-18 à US-23, US-06 c.2 ; aucune clé Stripe de test n'est encore configurée
  (tâche 4).
- **Décision** :
  - **SDK** `stripe` **23.1.0** (version fixée, publiée depuis plus de trois semaines ; API
    `2026-10-28.endive`, où la fin de période est portée par la ligne d'abonnement). CLI Stripe
    `v1.55.8` dans Docker pour relayer les webhooks en local.
  - **Toute la logique d'argent en base**, dans des fonctions réservées au serveur :
    `fulfill_purchase` (une fois par session de paiement, puis crédits, CV Pro ou retrait des
    publicités), `sync_subscription` (essai : 10 crédits et essai consommé ; début ou fin d'essai :
    quota de la formule ; montée : quota immédiat H25 ; descente : quota à la prochaine remise ;
    fin : crédits inclus à zéro H24 ; un événement tardif d'un ancien abonnement est ignoré),
    `run_monthly_grants` et `run_daily_maintenance` (planifiées par pg_cron). La maintenance
    rembourse aussi les opérations IA restées « en cours » plus de 15 minutes (report de
    l'ADR-027).
  - **Webhook** : signature vérifiée, abonnement relu chez Stripe (ordre indifférent), événement
    noté **après** traitement (un échec laisse Stripe réessayer ; traitements idempotents) ;
    événement d'un compte supprimé ignoré. Droits pendant les relances (`past_due`).
  - **Session Checkout** : client Stripe créé au premier achat (clé d'idempotence par compte),
    prix désigné par sa clé (`pro_month`…), langue de l'interface, **acceptation obligatoire des
    CGV avec renonciation au droit de rétractation** (texte traduit), facture pour les achats
    uniques. Contrôles avant paiement : déjà abonné, essai déjà utilisé, CV déjà débloqué.
  - **Retour de paiement** : `/api/me/wallet` interrogé toutes les 1,5 s pendant 10 s ; un achat
    est confirmé par sa session, un abonnement par la formule active.
  - **Recharge depuis « Solde insuffisant »** : le paiement revient sur la génération, qui reprend
    une fois l'achat confirmé.
  - **Suppression du compte** : le client Stripe est supprimé d'abord (abonnement résilié
    aussitôt) ; en cas d'échec, le compte n'est pas supprimé (`PAYMENT_ERROR`).
  - **Écarts au modèle** : pas de contrainte « CV obligatoire » sur `purchases` (le CV peut être
    remplacé ou supprimé ensuite) ; vérifiée à l'achat. Les composants d'achat sont passés aux
    pages des autres fonctionnalités par emplacements (`topUp`, actions des cartes de formule).
  - **Sans clé Stripe**, le paiement affiche « Le paiement est momentanément indisponible » ;
    clés obligatoires en production.
- **Reporté** : vérification réelle avec Stripe en mode test (dès la tâche 4 : script, Checkout,
  portail, webhooks) ; retrait des publicités (Inc-11) ; comptes de démonstration
  (`seed.sql`, Inc-13 : les comptes se créent par connexion, les formules par
  `sync_subscription`).
- **Risque résiduel** : deux paiements d'abonnement lancés en même temps sur le même compte
  donneraient deux abonnements chez Stripe (le second remplace le premier en base) ; contrôle
  avant paiement, cas rare, résiliation possible par le portail.
- **Impact** : financier / sécurité (fort)

---

## ADR-028 — Choix de réalisation des exports PDF et DOCX (Inc-5)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : backend-engineer, frontend-engineer, security-engineer)
- **Contexte** : US-16 et US-17 ; aucun abonnement ni achat n'existe encore (Inc-6).
- **Décision** :
  - **Bibliothèques** (versions fixées, publiées depuis plus de deux semaines) :
    `@react-pdf/renderer` 4.9.0 et `docx` 9.15.3 (la 9.16 a 4 jours). Outils de test :
    `unpdf` et `mammoth` (extraction du texte, comme un logiciel de recrutement).
  - **Police du PDF : Arimo** (licence libre OFL, mêmes dimensions qu'Arial), fournie par
    `@expo-google-fonts/arimo` et intégrée au PDF, au lieu de Poppins prévue à l'architecture :
    la règle ATS H34 demande une police standard, et l'aperçu utilise déjà Arial. Arimo couvre
    tous les caractères des noms européens (Ł, č, ş, œ…), ce que les polices de base du PDF ne
    font pas. Le DOCX utilise Arial, présente dans Word.
  - **Aucune césure automatique** dans le PDF : un mot-clé coupé ne serait plus reconnu.
  - **PDF** : même contenu et même ordre que l'aperçu (rubriques vides omises), intitulés en
    capitales, un intitulé n'est jamais laissé seul en bas de page ; filigrane « Créé avec … »
    dans la langue du CV et avec le nom de marque de cette langue, sur chaque page, en ligne de
    texte séparée du contenu.
  - **DOCX** : styles Word standard (« Titre » pour le nom, « Titre 1 » pour les rubriques),
    vraies listes à puces, coordonnées dans le corps du document.
  - **Route** `GET /api/cv/[id]/export?format=pdf|docx` : 400 (format), 401 (session), 404 (CV
    absent ou d'un autre compte, lu par le client soumis à la RLS), 403 (DOCX sans droit) ;
    `Cache-Control: private, no-store`. Nom « CV-Prénom-Nom », accents compris, avec une
    variante sans accent.
  - **Droit** `canExportWithoutWatermark(formule, CV Pro)` dans le moteur de droits, partagé par
    la route et l'interface. D'ici l'Inc-6, tout le monde a le PDF avec filigrane et le DOCX
    verrouillé, avec une explication et un lien vers les offres.
  - Boutons d'export **inactifs tant qu'une modification n'est pas enregistrée** : le fichier
    reflète toujours l'aperçu.
  - Couleurs et police du CV partagées par l'aperçu, le PDF et le DOCX
    (`features/cv/document-style.ts`, R09).
- **Alternatives écartées** : navigateur sans interface (Chromium) pour le PDF, lourd sur
  Vercel ; polices de base du PDF (caractères manquants) ; Poppins (police décorative, moins
  sûre pour les logiciels de recrutement).
- **Impact** : fonctionnel (moyen)

---

## ADR-027 — Choix de réalisation de la création du CV par l'IA (Inc-4)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : ai-engineer, backend-engineer, frontend-engineer,
  security-engineer)
- **Contexte** : US-10 à US-15 et US-42 ; la clé Anthropic n'est pas encore fournie (tâche 3).
- **Décision** :
  - **SDK officiel** `@anthropic-ai/sdk` **1.6.0**, version fixée publiée depuis plus de deux
    semaines (la 1.12 a 3 jours). Syntaxe vérifiée dans la documentation et les types du SDK.
  - **Appel** : `claude.beta.messages.stream(...).finalMessage()` (flux côté serveur),
    `claude-opus-5-5`, effort `low`, sortie structurée (schéma JSON produit depuis Zod), repli
    côté serveur `fallbacks: "default"` (en-tête `server-side-fallback-2026-07-01`). Le motif
    d'arrêt est contrôlé avant toute lecture : refus → `AI_UNAVAILABLE`, coupure →
    `AI_INVALID_OUTPUT` ; puis le texte est validé par Zod. 60 s par tentative, une nouvelle
    tentative (gérée par le SDK, erreurs transitoires seulement), 110 s au total ; page de
    génération à `maxDuration = 150`.
  - **Consigne** : faits tirés des seules réponses (aucune entreprise, date ou diplôme inventé),
    rédaction dans la langue du CV, règles ATS (H34), réponses encadrées par des balises et
    échappées, traitées comme des données (R06). Pas de cache de prompt : la consigne est sous le
    minimum mesurable.
  - **IA simulée** sans clé (développement, tests, CI) : le CV reprend les réponses. La clé est
    **obligatoire en production** (le démarrage échoue sinon). Le mot-clé `[simulation:echec]`
    ne fait échouer que l'IA simulée (test du remboursement).
  - **Orchestration en trois fonctions SQL réservées au serveur** : `begin_ai_operation`
    (verrou du portefeuille, rejeu d'une même demande, limite par minute, gratuité avec plafond
    par IP, débit), `complete_cv_generation` (CV créé ou remplacé, plafond de CV conservés,
    gratuité consommée, coûts), `fail_ai_operation` (remboursement unique, cause). Chacune est
    tout ou rien.
  - Colonne **`cvs.operation_id`** (unique) ajoutée au modèle : une demande rejouée retrouve son
    CV au lieu d'en créer un second.
  - **Une seule génération gratuite à la fois** : une seconde demande pendant qu'une gratuite est
    en cours reçoit `RATE_LIMITED` plutôt qu'un débit.
  - **Adresse IP** hachée en HMAC-SHA256 avec `IP_HASH_SALT` (`x-real-ip` fixé par Vercel). Sans
    sel (local), le plafond n'est pas appliqué ; le sel est obligatoire en production.
  - **Brouillon** dans le `localStorage` (copie en mémoire si le stockage est refusé), lu avec
    `useSyncExternalStore` (aucun écart d'hydratation).
  - **Éditeur** : modification sur place par rubrique, enregistrement 1 s après la dernière
    frappe (envois ordonnés, « Enregistrement… » dès la frappe, avertissement si l'on quitte la
    page avant l'enregistrement). **TanStack Query n'est pas ajouté** : une action serveur suffit
    pour cette seule mutation. Le solde de l'en-tête est relu par `refresh()` (next/cache)
    après un débit.
  - **Feuille du CV** : une colonne, police standard (Arial), intitulés standard traduits dans la
    langue du CV (`cvSections`), mots très longs coupés (adresses e-mail sur mobile).
  - **En-tête mobile** (maquette §2) : « Mes CV » et « Mon compte » passent dans un menu, le
    solde reste visible ; tient sur 360 px. Page « Mes CV » minimale (pagination : Inc-10). Le
    sélecteur de langue arrive en flux (pages à paramètre, `/cv/[id]`).
  - **Encart des offres** (US-15) uniquement sur l'aperçu, fermeture mémorisée dans le
    navigateur. Les fenêtres « Solde insuffisant » et « Remplacer un CV » mènent à Tarifs (achat
    à l'Inc-6).
  - Sans brouillon, la page de génération affiche le message et un lien vers les questions (au
    lieu d'une redirection).
- **Reporté** : suppression d'un CV (`deleteCv`) avec l'historique (Inc-10) ; encart limité aux
  formules supérieures (US-15 c.3) et encart CV Pro (Inc-6) ; remboursement des opérations
  restées « en cours » après un arrêt brutal du serveur (maintenance quotidienne, Inc-6) ;
  mesure sur 20 profils de référence (US-11 c.4 et c.5) dès que la clé est fournie (tâche 3).
- **Alternatives écartées** : débit et création du CV en plusieurs requêtes sans transaction
  (double débit, CV sans débit) ; lecture automatique de la sortie par le SDK (elle échoue avant
  le contrôle du motif d'arrêt) ; IA appelée depuis le navigateur (clé exposée).
- **Impact** : financier / sécurité (fort)

---

## ADR-026 — Choix de réalisation des crédits et droits (Inc-3)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : database-architect, backend-engineer, security-engineer)
- **Contexte** : US-07 à US-09 ; aucune opération IA (Inc-4) ni aucun abonnement (Inc-6)
  n'existe encore.
- **Décision** :
  - **Fonctions SQL** `SECURITY DEFINER`, exécutables par le seul rôle serveur :
    `spend_credits` (verrou sur l'opération puis sur le portefeuille ; inclus d'abord si la
    matrice le permet ; une opération déjà débitée ne l'est pas une seconde fois),
    `refund_operation` (une seule fois, dans les soldes d'origine), `grant_credits`,
    `set_included_credits` (le reste expire, sans report). Erreurs explicites
    (`INSUFFICIENT_CREDITS`, `OPERATION_NOT_FOUND`…). Elles renvoient les nouveaux soldes.
  - **Journal non modifiable** (déclencheur sur `update`) ; la suppression reste possible pour
    la cascade de suppression du compte. La clé vers `purchases` sera ajoutée à l'Inc-6, avec la
    table.
  - **Moteur de droits** en code pur (`src/features/plans/entitlements.ts`) : coût d'une
    opération, crédits utilisables selon la formule, gratuité de la première génération, droits
    hors IA ; testé sur toute la matrice.
  - **Formule affichée** : « Aucun abonnement » pour tous jusqu'à l'Inc-6 (aucun abonnement ne
    peut exister avant les paiements).
  - **En-tête** : la partie « compte » (solde + Mon compte) passe dans `components/layout`, seule
    couche autorisée à assembler deux fonctionnalités.
  - Test de parité des traductions corrigé : les formes plurielles ICU (`one {credit}`) ne sont
    plus prises pour des variables.
- **Reporté** (avec la première fonctionnalité qui en a besoin) : orchestration serveur d'une
  opération IA (création, débit, remboursement) et coût affiché sur les boutons IA, fenêtre
  « Solde insuffisant » (Inc-4) ; cadenas sur les fonctions non incluses (Inc-7 à 9) ; formule,
  date de remise et renouvellement (Inc-6) ; comptes de démonstration (`seed.sql`) avec formules
  (Inc-6).
- **Alternatives écartées** : débit côté application (risque de double débit) ; un seul solde
  (contraire au §12) ; fonctions appelables par l'utilisateur (crédits falsifiables).
- **Impact** : sécurité / financier (fort)

---

## ADR-025 — Accueil orienté conversion, illustration officielle, compatibilité ATS

- **Date** : 23/11/2026
- **Statut** : Accepté (remplace la disposition centrée de l'ADR-024 pour l'accueil)
- **Décideur** : l'utilisateur (critiques : trop de vide, en-tête décalé, plus d'image, textes
  peu convaincants, rappel que les CV doivent passer les logiciels de filtrage ; disposition
  « texte à gauche, image à droite » choisie parmi deux propositions), Claude pour la
  réalisation (rôles : ui-ux-designer, product-owner, frontend-engineer)
- **Contexte** : la page d'accueil doit pousser à créer un CV ; l'INTAKE §4.1 exige une
  illustration officielle de la marque, retirée par erreur à l'ADR-024.
- **Décision** :
  - **Disposition** : texte à gauche, illustration officielle du kit (jeune homme à
    l'ordinateur, CV validé, fusée, chronomètre 30s, détourée comme le logo) à droite sur
    ordinateur ; l'un sous l'autre sur téléphone et tablette. Section en plein premier écran,
    tailles et espacements proportionnels à l'écran.
  - **Textes** (5 langues) : mention « Optimisé pour les logiciels de recrutement (ATS) » ;
    titre « Ton CV professionnel en quelques secondes, prêt à passer les filtres des
    recruteurs. » (milieu de phrase mis en valeur) ; sous-titre qui décrit ce que fait l'IA et
    la suite (relire, ajuster, télécharger en PDF) ; avantages « 1er CV gratuit », « Sans carte
    bancaire », « CV en 5 langues ». Aucun chiffre ni score non vérifiable (ADR-002).
  - **En-tête** : même largeur que la page, plus haut (80 px) et texte plus grand sur
    ordinateur, bouton « Créer mon CV » toujours visible à partir de 1 024 px (§4.4).
  - **Conteneur de page** : 1 440 px, puis 80 % de l'écran sur les très grands écrans.
  - **Compatibilité ATS des CV** : règle H34 et critères ajoutés à US-11 et US-17 (mise en page
    sur une colonne, intitulés standard, texte réel, test d'extraction de texte des exports).
- **Alternatives écartées** : texte centré et image dessous (proposée, non retenue) ; maquette
  de CV dessinée en HTML (l'INTAKE demande l'illustration officielle) ; score ATS affiché
  (fonction inexistante, promesse trompeuse).
- **Image agrandie** (demande de l'utilisateur, « elle peut passer derrière le texte ») : à
    partir de 1 280 px, l'illustration occupe 64 % de la largeur de l'écran, centrée à droite,
    et passe sous le texte ; son premier cinquième (le fond bleu) s'efface en fondu et le texte
    occupe 46 % de la largeur, de sorte que le personnage commence après le titre (mesuré de
    1 280 à 2 560 px, en français et en allemand). En dessous de 1 280 px, texte centré puis
    image. Source agrandie deux fois (Lanczos sur alpha prémultipliée, légère netteté) : 1 298 px.
  - **Zoom du navigateur** (constat de l'utilisateur : à 25 %, l'image restait fixe) : aucune
    taille ne dépend plus seulement de la largeur de l'écran. Image bornée à 80 rem et ancrée au
    conteneur (débordement dans la marge limité à 12 rem) ; conteneur borné entre 90 et 120 rem ;
    formes réparties dans une zone centrée de 136 rem ; titre et sous-titre en unités `cqi`
    (proportionnels au conteneur). Vérifié à 25, 50, 100 et 200 % de zoom : même composition,
    titre sur 4 lignes, personnage toujours après le titre ; à 200 %, disposition tablette.
- **Conséquences** : l'illustration provient d'une planche de 1 536 px ; même agrandie avec
  soin, elle reste un peu douce sur les très grands écrans ; un fichier source en haute
  résolution (tâche 8) donnerait un rendu parfaitement net. Les tests vérifient le plein écran
  et comparent le titre sans ses balises.
- **Impact** : métier (fort : conversion) / technique (faible)

---

## ADR-024 — Bibliothèques d'interface : seulement le nécessaire ; accueil centré

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : l'utilisateur (« applique uniquement ce qui est nécessaire » sur une liste de
  bibliothèques ; structure de l'accueil fournie en image), Claude pour le tri (rôles :
  ui-ux-designer, frontend-engineer)
- **Contexte** : liste de bibliothèques d'interface, d'animation et d'effets proposée par
  l'utilisateur ; puis une capture d'une section d'accueil centrée à reproduire en structure.
- **Décision** :
  - **Déjà en place, conservés** : shadcn/ui, Tailwind CSS, Lucide React.
  - **Appliqué maintenant** : micro-interactions « bouton de chargement » (indicateur, double
    envoi impossible, y compris Google et déconnexion, jusque-là sans protection) et
    « apparition discrète » (fondu de 200 ms, supprimé si le système réduit les animations).
    Le bouton reste inactif tant que la page n'est pas interactive (un clic serait perdu) ; le
    champ e-mail n'est plus contrôlé, pour garder une saisie faite avant ce moment.
  - **Prévu plus tard** : Sonner (notifications « Copié », « Enregistré ») à l'Inc-4, déjà
    prévu par le design system ; TanStack Query (déjà prévu, ADR-009).
  - **Écartés** : Motion, GSAP, React Spring, Anime.js, Lenis (le CSS suffit aux animations
    courtes) ; React Three Fiber, Spline, Rive, Lottie, Aceternity, Magic UI, React Bits (poids
    et performance des pages publiques, NFR-01) ; Mantine, HeroUI, MUI, Ant Design (pas deux
    bibliothèques d'interface) ; React Hook Form (ADR-009) ; Recharts, Nivo, TanStack Table, dnd
    kit, Embla, Tiptap, React Flow, MapLibre (aucun besoin dans le périmètre).
  - **Accueil** : titre, sous-titre et bouton centrés, avancées clés dessous, formes
    décoratives en SVG autour (couleurs de la charte, sans animation) ; l'illustration
    « CV + chronomètre » est retirée de l'accueil.
  - **Accueil plein écran** (demande de l'utilisateur, « tout est groupé au centre ») : la
    section occupe toute la hauteur de l'écran sous l'en-tête (`100svh - 4rem`) ; titre et
    sous-titre de taille fluide (`clamp`, proportionnels à la largeur et limités par la
    hauteur), largeur du titre en `em` pour garder la même composition ; formes réparties sur
    toute la largeur et agrandies sur les grands écrans. Le retour à la ligne « équilibré » du
    navigateur, qui donnait des lignes inégales sur ce titre, n'est pas utilisé. Test de bout
    en bout : section jusqu'au bas de l'écran, bouton visible.
  - **Tests de bout en bout** : 3 navigateurs en parallèle en local, 2 en CI, et 10 s d'attente
    par vérification (15 s pour l'arrivée du code) : à 7 navigateurs, l'unique serveur de test
    saturait (envoi du code mesuré jusqu'à 4,7 s), d'où des échecs aléatoires.
- **Alternatives écartées** : ajouter Motion ou des collections d'effets « au cas où » ;
  notifications pour chaque enregistrement dès maintenant (les messages dans la page suffisent).
- **Conséquences** : aucune nouvelle dépendance ; suite de bout en bout plus rapide (moins d'une
  minute) et stable.
- **Impact** : technique (faible) / métier (faible)

---

## ADR-023 — Logo : celui du kit fourni, à l'identique

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : l'utilisateur (« le logo doit être exactement ce que je t'ai fourni » ; choix pour
  les autres langues posé par Claude), Claude pour la réalisation (rôle : ui-ux-designer)
- **Contexte** : l'en-tête affichait un logotype typographique en attendant des fichiers séparés
  (tâche 8). Le seul logo fourni est sur la planche du kit web, en français, sur un damier
  « transparent » peint dans l'image.
- **Décision** :
  - Logo **détouré du kit** (`Kit UI Mon CV en 30 Secondes_web.png`, zone 15,20 – 850,282) :
    fond en damier retiré, halo bleu recomposé (moyenne du damier, transparence estimée d'après
    la saturation), îlots de bruit supprimés. Fichiers : `src/assets/brand/logo-fr.png` et
    l'icône seule `logo-icone.png`, redimensionnés par `next/image`.
  - **Français** : le logo à l'identique (texte alternatif « Mon CV en 30 Secondes »).
  - **Anglais, italien, espagnol, allemand** : l'icône du logo suivie du nom traduit, sur deux
    lignes comme le logo fourni (choix de l'utilisateur, qui maintient le nom traduit de
    l'ADR-018).
- **Alternatives écartées** : logo français dans toutes les langues ; attendre des fichiers
  séparés (l'utilisateur veut son logo tout de suite) ; nom traduit sur une seule ligne (déborde
  sur mobile en allemand).
- **Conséquences** : le logo est une image (pas de texte vectoriel) ; un fichier source fourni
  plus tard remplacera simplement les deux images.
- **Impact** : métier (faible)

---

## ADR-022 — Choix de réalisation des comptes (Inc-2)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : backend-engineer, security-engineer, database-architect)
- **Contexte** : connexion sans mot de passe (ADR-011), profil, suppression du compte, RLS, avec
  Cache Components de Next.js 16 et 5 langues.
- **Décision** :
  - **E-mail de connexion unique** pour l'inscription et les connexions suivantes
    (`supabase/templates/sign-in-code.html`) : code à 6 chiffres, aussi dans l'objet, et lien de
    secours vers `/auth/confirm` (vérification par `token_hash`, fonctionne dans un autre
    navigateur). Un bloc par langue, choisi par la langue enregistrée dans les métadonnées du
    compte ; le sélecteur de langue met à jour ces métadonnées et `profiles.locale`.
  - **Prénom et nom non recopiés par le déclencheur** (écart avec `docs/data-model.md` §5, mis à
    jour) : l'étape « Comment t'appelles-tu ? » s'affiche tant que le nom manque, pré-remplie avec
    Google ; c'est ce que demande US-04 c.2. Langue par défaut d'un profil : anglais, comme le site.
  - **Aucun client Supabase dans le navigateur** : toutes les opérations passent par des Server
    Actions et des Route Handlers. Les cookies de session sont donc `HttpOnly` (illisibles par un
    script injecté), `SameSite=Lax`, `Secure` en HTTPS.
  - **Proxy** : rafraîchit la session, renvoie un visiteur des pages privées vers la connexion
    (avec `next`) et une personne connectée hors de la connexion ; chaque page et action privée
    revérifie la session. `next` n'accepte que des adresses internes.
  - **Données de session jamais pré-rendues** : `connection()` avant chaque client Supabase
    serveur (le client lit l'heure courante, interdit pendant le préchargement de Next.js 16) ;
    le lien « Se connecter / Mon compte » de l'en-tête est la seule partie rendue à la requête des
    pages publiques, qui restent pré-rendues.
  - **Suppression** : `auth.admin.deleteUser` (clé secrète, côté serveur) supprime le compte et,
    en cascade, toutes ses données ; mot de confirmation dans la langue de l'interface
    (SUPPRIMER, DELETE, ELIMINA, ELIMINAR, LÖSCHEN), sans tenir compte de la casse. La
    résiliation Stripe s'ajoutera à l'Inc-6.
  - **Bouton Google** affiché seulement si `GOOGLE_AUTH_ENABLED=true` : sans identifiants OAuth
    (tâche 5), un bouton actif mènerait à une erreur.
  - **Tests de la base dans `tests/db/`** (et non `supabase/tests/`, exclu du lint), lancés par
    `npm run test:db` contre Supabase local, en CI comme en local.
  - Limites de Supabase Auth relevées **en local uniquement** (200 connexions et vérifications par
    5 minutes et par IP) pour les tests de bout en bout ; la production garde les valeurs par
    défaut.
  - `@supabase/supabase-js` 2.119.0 (et non 2.119.2, publiée 4 jours plus tôt) : version publiée
    depuis plus de deux semaines, par prudence sur la chaîne d'approvisionnement.
- **Alternatives écartées** : client Supabase navigateur (cookies lisibles par JavaScript) ; lien
  de connexion PKCE (ne fonctionne que dans le navigateur d'origine) ; recopier le nom Google sans
  confirmation (contraire à US-04 c.2) ; mot « SUPPRIMER » dans toutes les langues (incompréhensible
  hors français).
- **Conséquences** : en production, les adresses de retour (`https://<domaine>/auth/**`) et le
  modèle d'e-mail doivent être reportés dans Supabase (tâche 2, Inc-13). Restent pour plus tard :
  formule, crédits et achats sur la page compte (Inc-3, Inc-6), lien « Gérer mon abonnement » et
  résiliation à la suppression (Inc-6), retour aux réponses des 5 questions après connexion (Inc-4,
  le mécanisme `next` est en place).
- **Impact** : sécurité (fort) / technique (moyen)

---

## ADR-021 — Choix de réalisation de la vitrine (Inc-1)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : frontend-engineer, ui-ux-designer, seo-engineer)
- **Contexte** : accueil, tarifs et pages légales dans les 5 langues, avant l'existence des comptes,
  de la création de CV et des paiements.
- **Décision** :
  - **Catalogue unique** `src/features/plans/catalog.ts` : prix, crédits, packs, coûts des
    opérations et matrice des droits ; l'accueil, les tarifs et (plus tard) le moteur de droits et
    Stripe en dépendent. Les économies annuelles sont calculées (ADR-002).
  - **Tarifs sans bouton de souscription** jusqu'à l'Inc-6 : la page informe (prix, crédits,
    fonctions, conditions) et propose « Créer mon CV gratuitement », conformément au §14 (première
    proposition payante après la première génération). Les boutons arrivent avec Stripe.
  - Le bouton « Créer mon CV gratuitement » mène déjà à l'adresse traduite de l'assistant
    (`/fr/creer`, `/en/create`…), construit à l'Inc-4 ; d'ici là, cette adresse affiche la page 404.
  - **Bascule Mensuel / Annuel sans texte côté client** : les deux prix sont rendus sur le serveur,
    la bascule change seulement un attribut ; seules 3 parties des traductions sont envoyées au
    navigateur (langues, sélecteur, erreurs).
  - **Illustration de l'accueil en SVG** reprenant les motifs du kit (CV, validation, chronomètre
    30s), en attendant les fichiers officiels (tâche 8).
  - **Textes légaux en modules TypeScript typés** par langue (`src/features/legal/content/`), et non
    dans les fichiers de messages : volume important, structure vérifiée par test (mêmes sections,
    mêmes variables) ; informations du vendeur insérées depuis les variables `LEGAL_*`, exigées en
    production (`VERCEL_ENV=production`). Traductions anglaise, italienne, espagnole et allemande
    réalisées en parallèle puis vérifiées (structure, variables, types).
  - Fuseau horaire de référence `Europe/Paris` pour les dates affichées.
  - Métadonnées par page : titre, description, adresse canonique et `hreflang` pour les 5 langues ;
    sitemap, robots.txt et données structurées restent à l'Inc-12 (US-39).
  - Ordre des cartes de formules identique sur mobile et ordinateur (Essential, Pro, Premium) :
    l'ordre de lecture reste cohérent ; Pro est signalée par son badge (écart mineur avec
    `docs/design/flows.md` §3.2).
- **Alternatives écartées** : boutons de souscription inactifs (trompeurs) ; textes légaux dans les
  messages (envoyés inutilement et difficiles à relire) ; recadrer les planches du kit (fond en
  damier incrusté).
- **Conséquences** : US-01 (critère 3) et US-03 (critère 2, sélection d'une formule) seront
  complètement vérifiés aux Inc-4 et Inc-6.
- **Impact** : métier / technique (faible)

---

## ADR-020 — Outillage du socle (Inc-0)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôles : devops-engineer, frontend-engineer)
- **Contexte** : mise en place du socle ; compatibilités constatées lors de l'installation.
- **Décision** :
  - **TypeScript 6.0.3** (et non 7.0) : typescript-eslint 8.73 n'accepte que TypeScript < 6.1.
  - **ESLint 9.39.5** (et non 10) : les extensions utilisées par `eslint-config-next` 16.4.6
    (import, jsx-a11y, react) ne déclarent pas encore ESLint 10 ; à revoir quand Next.js les met
    à jour.
  - **Cache Components et Partial Prefetching activés** (configuration par défaut de Next.js 16.4,
    qui deviendra obligatoire à la prochaine version majeure).
  - Langue lue avec **`next/root-params`** (recommandé par Next.js 16.3+ et next-intl 4.15) ;
    les Server Actions et Route Handlers passent la langue explicitement.
  - **shadcn/ui sur Base UI** (préréglage par défaut `base-nova` de shadcn 4) plutôt que Radix ;
    fonction `cn` fournie par le paquet `cn`.
  - Hooks Git avec **simple-git-hooks + lint-staged** (légers, sans dépendance supplémentaire).
  - **Prettier** avec tri des classes Tailwind ; Markdown exclu (tableaux mis en forme à la main).
  - **@axe-core/playwright** pour l'audit d'accessibilité automatique (US-37).
  - CLI Supabase épinglée en 3.2.0 (3.3.0 sortie entre-temps ; montée de version à part).
- **Alternatives écartées** : TypeScript 7 et ESLint 10 (outillage incompatible) ; désactiver Cache
  Components (contraire à l'évolution de Next.js) ; husky (plus lourd).
- **Conséquences** : `npm audit` signale 4 vulnérabilités modérées dans les dépendances de la CLI
  shadcn (outil de développement, jamais livré au navigateur) ; la CI audite uniquement les
  dépendances de production. L'audit d'accessibilité a déjà corrigé un défaut (nom accessible du
  sélecteur de langue, WCAG 2.5.3).
- **Impact** : technique (faible)

---

## ADR-019 — Mise en œuvre du multilingue

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : solution-architect)
- **Contexte** : ADR-018 ; SEO par langue ; App Router de Next.js 16.
- **Décision** :
  - next-intl 4.15 (compatible Next.js 16 et React 19) : segment `[locale]`, chemins traduits,
    messages typés dans `messages/<langue>.json`, français comme langue de référence.
  - Langue détectée depuis le navigateur à la première visite, **anglais** si la langue n'est pas
    proposée ; préférence mémorisée (cookie strictement nécessaire) et dans `profiles.locale`.
  - `hreflang`, `x-default` et sitemap par langue.
  - `language` stockée sur les CV et les contenus générés ; titres de sections traduits par
    l'application ; langue de sortie imposée à l'IA.
  - Modèles d'e-mail Supabase avec un bloc par langue ; Stripe ouvert dans la langue de
    l'utilisateur, noms de produits neutres.
  - Test de parité des clés de traduction en CI.
- **Alternatives écartées** : langue en cookie seul sans préfixe d'adresse (mauvais pour le SEO) ;
  bibliothèque i18n générique sans routage Next.js ; traduction automatique à l'exécution
  (qualité et coût non maîtrisés).
- **Conséquences** : Inc-0 passe de M à L ; chaque incrément livre ses textes dans les 5 langues ;
  relecture par des locuteurs natifs recommandée (tâche manuelle 12).
- **Impact** : technique (moyen)

---

## ADR-018 — Site multilingue dès le lancement

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : l'utilisateur (demande « il faut tenir compte du multilingue », questions posées
  par Claude)
- **Contexte** : l'INTAKE ne prévoyait que le français (H1, multilingue hors périmètre).
- **Décision** : français, anglais, italien, espagnol et allemand, **tous disponibles dès le
  lancement** ; langue du CV et des contenus au choix, par défaut celle de l'interface ; **nom de
  marque traduit par langue** (propositions H31 à valider).
- **Alternatives écartées** : français seul au lancement avec un site seulement préparé ; nom de
  marque unique ; CV toujours dans la langue de l'interface ou des réponses.
- **Conséquences** : H1 remplacée ; US-41 et US-42 ajoutées ; pages légales, e-mails et parcours
  de paiement dans les 5 langues ; relecture juridique par langue et par pays de vente (R20).
- **Impact** : métier / légal (fort)

---

## ADR-017 — Conservation des comptes inactifs : 3 ans

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : l'utilisateur (question posée par Claude, rôle : database-architect)
- **Contexte** : le RGPD impose une durée de conservation limitée.
- **Décision** : suppression automatique après 3 ans sans activité, e-mail d'avertissement
  30 jours avant ; un abonnement actif empêche la suppression (US-40, H28).
- **Alternatives écartées** : 2 ans ; conservation jusqu'à suppression par l'utilisateur.
- **Conséquences** : colonnes `last_seen_at` et `retention_warning_sent_at`, tâche quotidienne,
  envoi d'e-mails ; les CGV doivent mentionner la perte des crédits achetés non utilisés.
- **Impact** : légal (moyen)

---

## ADR-016 — Design : thème clair, tokens accessibles, tutoiement

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : ui-ux-designer)
- **Contexte** : §2 de l'INTAKE (dominante blanche, éviter les interfaces sombres) et exigence AA.
- **Décision** : thème clair uniquement ; ajout de `primary-strong` (#0A58BD) pour les liens,
  `muted-foreground` (#4A5B73) et `input-border` (#7A8CA8) pour atteindre les contrastes AA ;
  jaune et cyan jamais en texte ; Poppins servie par le site ; icônes Lucide ; tutoiement dans
  l'interface, vouvoiement dans les pages légales.
- **Alternatives écartées** : mode sombre (contraire au §2.4) ; icônes 3D du kit partout (lourdes,
  réservées au marketing).
- **Conséquences** : `docs/design/design-system.md` fait référence.
- **Impact** : métier (faible)

---

## ADR-015 — Exports PDF et DOCX côté serveur

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : solution-architect)
- **Contexte** : filigrane non contournable (§5.3), texte sélectionnable, DOCX pour les ayants droit.
- **Décision** : Route Handler d'export ; PDF avec `@react-pdf/renderer` (Poppins embarquée),
  DOCX avec `docx` ; même schéma de CV et mêmes constantes de mise en page que l'aperçu.
- **Alternatives écartées** : navigateur sans interface (Chromium) pour imprimer l'aperçu HTML
  (lourd et lent sur Vercel) ; génération dans le navigateur (filigrane contournable).
- **Conséquences** : deux rendus à maintenir alignés (R09), vérifiés par comparaison visuelle.
- **Impact** : technique (moyen)

---

## ADR-014 — Tâches planifiées : pg_cron et Vercel Cron

- **Date** : 23/11/2026
- **Statut** : Accepté ; Vercel Cron remplacé par le cron du VPS (ADR-038)
- **Décideur** : Claude (rôle : solution-architect)
- **Contexte** : remise mensuelle des crédits (y compris en annuel) et rétention des comptes.
- **Décision** : `pg_cron` toutes les heures pour `run_monthly_grants()` (SQL pur, identique en
  local et en production) et chaque jour pour la maintenance ; Vercel Cron quotidien pour la
  rétention (envoi d'e-mails, suppression via l'API d'administration).
- **Alternatives écartées** : tout sur Vercel Cron (remise moins robuste, dépend d'un appel HTTP) ;
  tout sur `pg_cron` (pas d'envoi d'e-mail ni d'API d'administration depuis SQL).
- **Conséquences** : deux mécanismes, chacun idempotent et testé.
- **Impact** : technique (faible)

---

## ADR-013 — Paiements Stripe

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : backend-engineer), suite à Q1
- **Contexte** : packs, CV Pro, retrait des pubs, 3 formules × 2 périodicités, essai, gestion en
  ligne, renonciation au droit de rétractation.
- **Décision** : Stripe Checkout (paiement et abonnement) et portail client ; prix TTC identifiés
  par lookup keys et créés par `scripts/stripe-seed.ts` ; acceptation obligatoire des conditions
  dans Checkout avec un texte de renonciation ; webhook signé et idempotent qui relit l'état
  depuis Stripe ; CLI Stripe dans Docker en local.
- **Alternatives écartées** : formulaire de paiement intégré au site (plus de code et de
  conformité à gérer) ; identifiants de prix en variables d'environnement (11 variables à tenir
  à jour).
- **Conséquences** : URL des conditions à renseigner dans Stripe (tâche à l'Inc-6).
- **Impact** : financier / légal (moyen)

---

## ADR-012 — Couche IA

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : backend-engineer), suite à Q4
- **Contexte** : qualité, coût (R01), durée (R02), fiabilité des sorties (R05), injection (R06).
- **Décision** : SDK officiel `@anthropic-ai/sdk` ; modèle par variable d'environnement (défaut
  `claude-opus-5-5`) ; effort `low` explicite ; sorties structurées validées par Zod ; réponse en
  flux côté serveur ; délai 60 s, une nouvelle tentative transitoire ; repli automatique côté
  serveur en cas de refus du modèle (`fallbacks: "default"`) ; données utilisateur encadrées
  comme données ; journal `ai_operations` (tokens, coût, durée) ; idempotence par `requestId`.
- **Alternatives écartées** : appels HTTP bruts (le SDK officiel est la norme) ; JSON libre sans
  schéma (sorties non fiables).
- **Conséquences** : coût par opération mesurable ; syntaxe exacte vérifiée dans la
  documentation à l'Inc-4.
- **Impact** : technique / financier (moyen)

---

## ADR-011 — Authentification sans mot de passe

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : security-engineer), suite à Q3
- **Contexte** : compte demandé juste avant la génération, sans perdre les réponses.
- **Décision** : Supabase Auth, code à 6 chiffres par e-mail (même onglet, lien en secours) et
  Google ; proxy Next.js 16 pour la session et la redirection, revérification côté serveur ;
  brouillon des 5 questions dans le `localStorage`, effacé après enregistrement du CV.
- **Alternatives écartées** : mot de passe (friction, sécurité à gérer) ; lien magique seul
  (ouvre un autre onglet) ; `sessionStorage` (perdu si l'e-mail s'ouvre dans un autre onglet).
- **Conséquences** : le brouillon reste sur l'appareil jusqu'à la génération (mentionné dans la
  politique de confidentialité).
- **Impact** : sécurité / métier (moyen)

---

## ADR-010 — Frontières serveur et écritures privilégiées

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : solution-architect)
- **Contexte** : crédits, abonnements, achats et création de CV ne doivent pas être modifiables
  par l'utilisateur, même avec la clé publique.
- **Décision** : Server Actions pour les mutations de l'interface ; Route Handlers pour le
  webhook, les exports, le solde interrogé et le cron ; trois clients Supabase (navigateur,
  serveur soumis à la RLS, admin serveur uniquement) ; écritures sensibles via des fonctions SQL
  `SECURITY DEFINER` exécutables par le seul rôle serveur ; privilèges Postgres par colonne.
- **Alternatives écartées** : Edge Functions Supabase (deuxième environnement d'exécution à
  maintenir) ; écritures sensibles depuis le client protégées par la seule RLS (insuffisant pour
  des règles comme « débit atomique »).
- **Conséquences** : modules serveur marqués `server-only` ; tests RLS et tests de fonctions SQL.
- **Impact** : sécurité (fort)

---

## ADR-009 — Stack, versions et organisation du code

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : solution-architect)
- **Contexte** : stack par défaut du skill ; versions relevées sur npm le 23/11/2026.
- **Décision** : Next.js 16.4, React 19.3, Tailwind 4.3, shadcn/ui, Zod 4, TanStack Query 5,
  Supabase (supabase-js 2.119, ssr 0.12, CLI 3.2 en dépendance du projet), Vitest 5,
  Playwright 1.65 ; TypeScript strict dans la version supportée par Next.js et typescript-eslint
  (vérifiée à l'Inc-0). Organisation par fonctionnalité (`src/features/*`), sous-dossiers créés
  seulement s'ils servent. Écarts : pas de bibliothèque de formulaires (Server Actions +
  `useActionState`) ; TanStack Query limité au solde interrogé et à l'enregistrement automatique.
- **Alternatives écartées** : react-hook-form (inutile avec les Server Actions) ; état global
  côté client (aucun besoin).
- **Conséquences** : versions épinglées, fichier de verrouillage versionné.
- **Impact** : technique (moyen)

---

## ADR-008 — Règles produit précisées en phase 1 (H18 à H27)

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : product-owner)
- **Contexte** : l'écriture des critères d'acceptation a révélé des cas non couverts par l'INTAKE
  (détail dans `docs/product/user-stories.md` §2).
- **Décision** :
  - H18 — En-tête du CV : nom saisi à la première connexion, e-mail du compte, téléphone et ville
    facultatifs ; pas de photo ; pas de sixième question.
  - H19 — Réponses en texte libre guidé ; seule la question 1 est obligatoire ; 2 000 caractères
    maximum par réponse.
  - H20 — Contenus générés conservés avec le CV concerné.
  - H21 — Lettre et version LinkedIn : modification et copie, sans export de fichier.
  - H22 — Remplacement de CV hors Pro/Premium : l'utilisateur choisit le CV remplacé ; un
    déblocage CV Pro est perdu avec lui, après avertissement ; un ancien abonné Pro garde ses CV.
  - H23 — Suppression du compte : résiliation immédiate sans remboursement, crédits perdus.
  - H24 — Paiement échoué : droits maintenus pendant les relances Stripe, retirés à l'annulation.
  - H25 — Montée de formule : solde inclus porté immédiatement au nouveau quota.
  - H26 — Vidéo récompensée proposée à tout utilisateur sans abonnement, retrait des pubs compris.
  - H27 — Au plus 3 générations gratuites par adresse IP et par jour.
  - L'achat du retrait des publicités passe de l'Inc-6 à l'Inc-11, avec les publicités : le vendre
    avant qu'elles existent n'aurait aucun effet visible.
- **Alternatives écartées** : sixième question « identité » (contraire aux 5 questions du §5.1) ;
  remboursement au prorata à la suppression du compte (plus complexe, rare) ; refuser la vidéo
  récompensée après retrait des pubs (prive l'utilisateur d'un moyen gratuit d'obtenir des
  crédits).
- **Conséquences** : critères d'acceptation testables ; matrice des droits unique (§3 des stories).
- **Impact** : métier (faible à moyen, réversible)

---

## ADR-007 — Environnement de développement local sur Docker Desktop

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : l'utilisateur (Docker Desktop imposé), Claude pour la répartition (rôle : devops-engineer)
- **Contexte** : l'utilisateur impose Docker Desktop pour le développement local ; il est déjà
  démarré (moteur 29.9.3, Compose v5.7). Sur la machine : Node.js 24.16, npm 11.13, Git 2.54,
  CLI Supabase 2.121 (3.2 disponible).
- **Décision** :
  - **Dans Docker** : toute la pile Supabase locale (Postgres, Auth, API, Studio, Mailpit pour
    lire les e-mails de connexion), lancée par la CLI Supabase ; plus tard, la CLI Stripe pour
    relayer les webhooks (image officielle, rien à installer).
  - **Sur la machine** : le serveur Next.js (`npm run dev`) avec Node.js 24.
  - CLI Supabase **épinglée comme dépendance du projet** (`npx supabase`), pour que la machine
    et la CI utilisent la même version ; l'installation globale n'est pas nécessaire.
  - Services Supabase inutiles désactivés dans `supabase/config.toml` (stockage, temps réel,
    fonctions edge) pour alléger Docker.
- **Alternatives écartées** : Next.js aussi dans un conteneur (sous Windows, les fichiers montés
  dans un conteneur ralentissent fortement le rechargement à chaud) ; projet Supabase en ligne
  dès le développement (inutile en local, et les tests RLS doivent tourner hors ligne et en CI).
- **Conséquences** : aucun compte Supabase ni SMTP n'est nécessaire avant la mise en production.
  Docker Desktop doit être démarré pour développer et lancer les tests. Si l'utilisateur veut
  aussi l'application en conteneur, un service Compose pourra être ajouté.
- **Impact** : technique (faible, réversible)

---

## ADR-006 — Arbitrages de l'utilisateur sur les questions Q1 à Q6

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : l'utilisateur (questions posées par Claude, rôle : project-director)
- **Contexte** : six points à impact financier, métier ou irréversible, détaillés dans
  `docs/PLAN_DE_REALISATION.md` §10.
- **Décision** :
  - Q1 — Paiement : **Stripe** (Checkout, abonnements, portail client, webhooks).
  - Q2 — Adaptation, mots-clés, lettre, entretien, LinkedIn sans formule Pro : **accessibles en
    payant avec des crédits achetés**. Les crédits inclus d'Essential ne les débloquent pas.
  - Q3 — Compte : **demandé juste avant la génération** ; les 5 questions se font sans compte.
  - Q4 — Modèle d'IA : **Claude Opus 5.5**, modèle configurable.
  - Q5 — Essai de 3 jours : **10 crédits d'essai**, 60 crédits au premier paiement.
  - Q6 — **Aucun backend mobile existant** : backend web propre, source d'abonnement enregistrée
    pour un futur branchement mobile.
- **Alternatives écartées** : Paddle ; fonctions réservées à Pro/Premium ou ouvertes aux crédits
  inclus d'Essential ; génération sans compte ou compte dès le départ ; Sonnet 5.5 et Haiku 5.5 ;
  60 crédits dès l'essai.
- **Conséquences** : un abonné Premium annuel qui consomme tous ses crédits peut coûter plus qu'il
  ne rapporte avec Opus 5.5. Parade : effort de réflexion bas, cache de prompt, suivi du coût par
  opération, modèle changeable par configuration.
- **Impact** : financier / métier (fort)

---

## ADR-005 — Historique limité à 1 CV hors Pro et Premium

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : project-director)
- **Contexte** : §10 réserve l'historique illimité à Pro ; §12 l'indique « Non » pour Essential sans
  préciser la limite.
- **Décision** : Gratuit, crédits seuls et Essential conservent 1 CV. Une nouvelle génération
  remplace l'actuel, après confirmation. Pro et Premium : historique illimité.
- **Alternatives écartées** : refuser toute nouvelle génération hors Pro (bloque un utilisateur qui
  paie des crédits) ; quota intermédiaire pour Essential (non demandé).
- **Conséquences** : règle simple, appliquée par le moteur de droits.
- **Impact** : métier (faible, réversible)

---

## ADR-004 — Deux soldes de crédits

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : project-director)
- **Contexte** : §12 impose de distinguer crédits inclus et crédits achetés, et renvoie aux
  « règles de gestion des crédits » sans les définir.
- **Décision** : solde **inclus** remis au quota de la formule chaque mois, sans report (y compris
  en annuel) ; solde **acheté** (packs, vidéos récompensées) sans expiration. Consommation :
  inclus d'abord, puis achetés. Débit atomique en base avant l'appel IA, remboursement si l'appel
  échoue.
- **Alternatives écartées** : solde unique (contraire au §12) ; expiration des crédits achetés
  (défavorable à l'utilisateur, non demandée).
- **Conséquences** : journal des mouvements + fonction Postgres de débit ; tâche planifiée
  mensuelle.
- **Impact** : métier / financier (moyen)

---

## ADR-003 — Charte graphique : kit web

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : ui-ux-designer)
- **Contexte** : deux kits fournis. Le kit web (bleu #0F6FE6, jaune #FFC107, bleu nuit #0B1F3A,
  cyan #00D4FF, bleu clair #E6F0FF) correspond au §2.1. Le kit app utilise une palette violette et
  une mascotte robot.
- **Décision** : appliquer le §2.1 et le kit web. Police Poppins (Regular, Medium, SemiBold, Bold).
- **Alternatives écartées** : palette violette du kit app (contraire au §2.1).
- **Conséquences** : l'écart avec le kit mobile est signalé, à arbitrer côté mobile.
- **Impact** : métier (faible)

---

## ADR-002 — Mentions commerciales exactes

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : product-owner)
- **Contexte** : §15 annonce « CV et lettres illimités » (Pro = 60 crédits/mois) et « économise
  43 % » (réel : −52 %).
- **Décision** : afficher les quotas réels et calculer les économies annuelles à partir des prix
  (Essential −37 %, Pro −52 %, Premium −42 %).
- **Alternatives écartées** : reprendre le texte tel quel (pratique commerciale trompeuse).
- **Conséquences** : une seule source de vérité pour les prix et les quotas, dans le code.
- **Impact** : légal (fort)

---

## ADR-001 — Le §12 fait foi sur le modèle économique

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Décideur** : Claude (rôle : project-director)
- **Contexte** : §4.3 et §15 décrivent l'ancienne offre « Pro mensuel / annuel ». §12 dit la
  remplacer par Essential / Pro / Premium.
- **Décision** : offres présentées : Gratuit, Crédits IA, Essential, Pro (recommandé), Premium,
  CV Pro à l'unité (4,99 €), retrait des publicités (2,99 €).
- **Alternatives écartées** : conserver l'ancienne formule à deux tarifs (contraire au §12).
- **Conséquences** : textes de l'accueil et du §15 adaptés aux trois formules.
- **Impact** : métier (moyen)

---

## ADR-000 — Modèle d'enregistrement

- **Date** : 23/11/2026
- **Statut** : Accepté
- **Contexte** : Ce fichier établit le format des décisions. À copier pour chaque nouvelle entrée.
- **Décision** : Utiliser ce gabarit pour toute décision ayant un impact sur l'architecture,
  les dépendances, la sécurité, le coût ou le comportement produit.
- **Alternatives écartées** : Documentation ad hoc dispersée — rejetée car non traçable.
- **Conséquences** : Traçabilité complète ; l'utilisateur peut revenir sur tout choix.

---

<!-- Copier ce bloc pour chaque nouvelle décision :

## ADR-NNN — <titre court>

- **Date** :
- **Statut** : Proposé / Accepté / Remplacé par ADR-XXX
- **Décideur** : Claude (rôle : <ex. solution-architect>)
- **Contexte** : <le problème, les contraintes>
- **Décision** : <ce qui a été choisi>
- **Alternatives écartées** : <option B — pourquoi non>
- **Conséquences** : <effets positifs et négatifs, dette éventuelle>
- **Impact** : technique / financier / métier / sécurité (et niveau)

-->
