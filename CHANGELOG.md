# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : SemVer.

## [Non publié]

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
