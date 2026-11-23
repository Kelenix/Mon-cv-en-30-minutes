# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : SemVer.

## [Non publié]

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
