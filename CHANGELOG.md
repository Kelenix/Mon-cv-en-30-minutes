# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : SemVer.

## [Non publié]

### Ajouté — Inc-4 : création du CV par l'IA

- Assistant des 5 questions : une question par écran, exemple, compteur, barre de progression,
  réponses gardées dans le navigateur (rechargement, connexion), langue du CV au choix.
- Génération du CV par Claude Opus 5.5 : rédaction fidèle aux réponses, dans la langue choisie,
  lisible par les logiciels de recrutement ; IA simulée tant que la clé n'est pas configurée.
- Première génération gratuite (consommée seulement si elle réussit), puis 1 crédit ; crédits
  rendus en cas d'échec ; 3 CV gratuits par jour et par adresse IP ; remplacement du CV quand la
  formule n'en garde qu'un ; fenêtre « Solde insuffisant ».
- Aperçu du CV sur une colonne, modification de chaque rubrique sur place avec enregistrement
  automatique, copie du texte, encart des fonctions avancées après la génération.
- Page « Mes CV » et, sur mobile, menu de l'en-tête.

### Corrigé

- En-tête d'un compte connecté qui débordait sur les écrans de 360 à 375 px.

### Ajouté — Inc-3 : crédits et droits

- Crédits inclus et crédits achetés pour chaque compte, avec un journal de tous les mouvements
  qui ne peut pas être modifié.
- Débit des opérations IA côté base de données : crédits inclus d'abord quand la formule le
  permet, jamais de solde négatif ni de double débit, remboursement unique en cas d'échec.
- Moteur de droits : coût de chaque opération, crédits utilisables selon la formule (Essential
  paie l'adaptation, la lettre et l'entretien en crédits achetés), première génération gratuite.
- Solde de crédits dans l'en-tête, avec le détail inclus / achetés et un lien « Recharger » ;
  section « Formule et crédits » dans l'espace compte.

### Modifié

- Accueil : nouveaux textes orientés vers la création de CV et la compatibilité avec les
  logiciels de recrutement (ATS), illustration officielle de la marque en grand à droite, qui
  passe derrière le texte sur ordinateur, section en plein premier écran dont les tailles
  s'adaptent à l'écran.
- En-tête : aligné sur la largeur de la page, texte plus grand et bouton « Créer mon CV » sur
  ordinateur.
- Boutons d'envoi : indicateur de chargement et double envoi impossible ; messages qui
  apparaissent en fondu.
- En-tête : logo du kit fourni à l'identique en français ; dans les autres langues, son icône
  suivie du nom traduit, sur deux lignes.

### Ajouté — Inc-2 : comptes

- Connexion et inscription sans mot de passe : code à 6 chiffres reçu par e-mail (lien de secours
  dans le même e-mail), bouton Google activable par configuration ; la page demandée est rouverte
  après connexion.
- Première connexion : « Comment t'appelles-tu ? », pré-rempli avec Google.
- Espace « Mon compte » : prénom, nom, téléphone et ville modifiables, e-mail affiché,
  déconnexion, suppression définitive du compte et de ses données après saisie d'un mot de
  confirmation.
- Lien « Se connecter » ou « Mon compte » dans l'en-tête ; pages privées protégées.
- E-mail de connexion et nouveaux écrans dans les 5 langues ; la langue choisie est enregistrée
  dans le compte.
- Base de données : table des profils avec règles d'accès (RLS) testées, colonnes modifiables
  limitées, création automatique du profil, suivi de l'activité pour la rétention.

### Ajouté — Inc-1 : vitrine (jalon M1)

- Accueil complet dans les 5 langues : promesse, appel à l'action, illustration de la marque, six
  fonctionnalités, aperçu des offres, appel final.
- Page Tarifs : formules Essential, Pro (recommandée) et Premium avec bascule Mensuel / Annuel et
  économies réelles (−37 %, −52 %, −42 %), packs de crédits, CV Pro, conditions de l'essai et du
  renouvellement, tableau comparatif et coût des opérations IA.
- Pages légales (mentions légales, CGU/CGV, confidentialité, cookies) en 5 langues, avec les
  informations du vendeur fournies par configuration et exigées en production.
- Adresses traduites (`/fr/tarifs`, `/en/pricing`, `/de/impressum`…), métadonnées, adresse
  canonique et `hreflang` par page ; liens Tarifs et légaux dans l'en-tête et le pied de page.
- Catalogue unique des offres, prix, crédits et droits, couvert par des tests.

### Ajouté — Inc-0 : socle technique (jalon M0)

- Application Next.js 16.4 (App Router, TypeScript strict, Cache Components).
- Charte graphique : tokens de couleurs accessibles (AA), Poppins, thème clair, bouton aux
  variantes du design system (shadcn/ui sur Base UI).
- Site en 5 langues (français, anglais, italien, espagnol, allemand) : détection de la langue du
  navigateur, adresses préfixées, sélecteur de langue, nom de marque traduit, page 404 et page
  d'erreur traduites.
- Supabase local dans Docker Desktop (services inutiles désactivés).
- Qualité : ESLint, Prettier, hook `pre-commit`, tests unitaires (parité des traductions), tests de
  bout en bout sur ordinateur et mobile avec audit d'accessibilité, intégration continue GitHub
  Actions.
