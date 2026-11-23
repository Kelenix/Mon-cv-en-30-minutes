# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : SemVer.

## [Non publié]

### Ajouté — Inc-11 : publicités

- Bandeau de consentement (Accepter / Refuser au même niveau) et lien « Gérer les cookies » dans
  le pied de page.
- Bannière en bas de l'accueil et de « Mes CV », annonce native signalée dans « Mes CV » ; aucune
  annonce pour les abonnés, ni pendant la création, la génération, l'aperçu ou le paiement.
- « Regarde une courte annonce pour obtenir 1 crédit IA » dans les crédits et la fenêtre
  « Solde insuffisant » (3 crédits par jour au plus).
- Interstitiel affiché une seule fois, en quittant l'aperçu du premier CV.
- Achat du retrait définitif des publicités (2,99 €), si l'option est activée.
- Mode simulation pour le développement et les tests ; fichier `ads.txt`.

### Modifié — transitions

- Navigation fluide : fondu entre les pages, en-tête immobile, contenu qui apparaît en douceur ;
  les onglets d'un CV restent affichés d'un onglet à l'autre ; plus de barres grises lors d'un
  chargement rapide.

### Ajouté — Inc-10 : historique des CV

- « Mes CV » : cartes avec Ouvrir et Supprimer (après confirmation, contenus générés compris),
  panneau « Ton historique » (nombre de CV et règle de ta formule), affichage par 12, page vide
  illustrée.

### Corrigé

- Un ancien abonné Pro qui a gardé plusieurs CV peut de nouveau créer un CV en en remplaçant un.

### Modifié

- Tous les écrans en pleine largeur : assistant de création (exemple et récapitulatif des
  réponses à droite), connexion, bienvenue, génération et pages d'erreur (illustration et atouts
  à droite), compte et crédits (cartes côte à côte), pages légales (sommaire fixe à gauche).

### Ajouté — Inc-9 : simulation d'entretien

- Onglet « Entretien » : poste visé et langue, 8 questions fréquentes adaptées au CV
  (2 crédits).
- Réponses écrites à tout ou partie des questions, puis retour gratuit pour chacune : points
  forts, points à améliorer, exemple de réponse.
- Simulations conservées avec le CV et consultables ensuite.

### Sécurité

- Les accroches, adaptations et simulations ne se modifient plus directement en base ; seuls la
  version LinkedIn et la lettre se corrigent.

### Ajouté — Inc-8 : LinkedIn et lettre de motivation

- Onglet « LinkedIn » : titre du profil, section Infos et une description par expérience, prêts
  à coller, dans les limites de LinkedIn (1 crédit).
- Onglet « Lettre de motivation » : poste visé, entreprise et annonce facultatives, lettre de
  250 à 400 mots sans rien inventer, nombre de mots affiché (2 crédits).
- Textes modifiables, enregistrés automatiquement, copiables bloc par bloc ; versions
  précédentes consultables depuis le CV ; langue au choix.

### Modifié

- Pages du CV en pleine largeur : aperçu, onglets et outils alignés à gauche ; sur ordinateur,
  formulaire à gauche et résultat à droite.

### Corrigé

- L'historique de « Adapter à une offre » ne déborde plus de l'écran sur mobile.

### Ajouté — Inc-7 : amélioration par l'IA

- « Améliorer avec l'IA » sous chaque expérience : avant / après, puis Remplacer ou Garder
  l'original (1 crédit).
- « Améliorer l'accroche » : 3 variantes (5 avec Pro et Premium) à choisir, consultables ensuite
  (1 crédit).
- Onglet « Adapter à une offre » : annonce collée, CV adapté sans rien inventer, mots-clés
  manquants, application au CV ou nouveau CV avec Pro et Premium (2 crédits).
- Fenêtre « Solde insuffisant » commune, avec recharge sur place et rappel des crédits achetés
  pour Essential.

### Ajouté — Inc-6 : paiements

- Abonnements Essential, Pro et Premium (mensuels ou annuels) et essai gratuit de Pro 3 jours
  avec 10 crédits, payés sur Stripe ; gestion de l'abonnement dans le portail Stripe.
- Packs de 5, 15 et 40 crédits et CV Pro (4,99 € pour un CV), avec acceptation des CGV et
  renonciation au droit de rétractation.
- Crédits inclus remis chaque mois, quota de la nouvelle formule dès une montée, crédits inclus
  perdus à la fin de l'abonnement (crédits achetés conservés).
- Page « Crédits et formule » : formule et échéance, soldes, recharge, coûts, achats ; solde mis
  à jour au retour du paiement.
- Recharge directement depuis la fenêtre « Solde insuffisant » ; la génération reprend ensuite.
- Résiliation immédiate de l'abonnement à la suppression du compte.

### Ajouté — Inc-5 : exports

- Téléchargement du CV en PDF, gratuit, nommé « CV-Prénom-Nom.pdf » : même contenu que
  l'aperçu, texte lisible par les logiciels de recrutement, mention « Créé avec … » en pied de
  page dans la langue du CV.
- PDF sans mention et DOCX (titres Word, listes) pour les abonnés ou avec CV Pro ; sinon, le
  bouton DOCX explique comment le débloquer.

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
