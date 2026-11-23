# Mon CV en 30 Secondes — version Web

Plateforme web qui crée un CV professionnel avec l'IA à partir de 5 questions, puis propose des
outils avancés (amélioration, adaptation à une offre, LinkedIn, lettre, entretien) avec des crédits
IA et des abonnements. Disponible en français, anglais, italien, espagnol et allemand.

Cahier des charges : [`INTAKE.md`](INTAKE.md) · Plan : [`docs/PLAN_DE_REALISATION.md`](docs/PLAN_DE_REALISATION.md)
· Avancement : [`PROJECT_STATE.md`](PROJECT_STATE.md)

## Prérequis

- **Node.js 22 ou plus récent** (développé avec la 24).
- **Docker Desktop démarré** : il fait tourner Supabase en local (base, authentification, e-mails de
  test).

## Installation

```bash
npm install
cp .env.example .env.local   # sous PowerShell : Copy-Item .env.example .env.local
```

## Lancement

```bash
npm run db:start   # démarre Supabase dans Docker (le premier démarrage télécharge les images)
npm run dev        # http://localhost:3000 → redirige vers la langue du navigateur
```

Outils locaux une fois Supabase démarré :

| Outil | Adresse |
|-------|---------|
| Supabase Studio (base de données) | http://localhost:54323 |
| Mailpit (e-mails de connexion) | http://localhost:54324 |

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Génération des types de routes + TypeScript |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests de bout en bout (Playwright, ordinateur et mobile, audit d'accessibilité) — la première fois : `npx playwright install chromium` |
| `npm run verify` | Lint + types + format + tests unitaires + build |
| `npm run db:start` / `db:stop` / `db:reset` / `db:status` | Supabase local |

Un hook Git `pre-commit` formate et vérifie les fichiers modifiés, puis contrôle les types.

## Structure

```
src/app/[locale]/   pages (une version par langue, chemins traduits)
src/components/     composants d'interface (ui/ = shadcn/ui) et mise en page
src/i18n/           langues, routage, chargement des traductions
src/core/           configuration (variables d'environnement validées)
src/proxy.ts        détection de la langue et préfixe d'adresse
messages/           textes de l'interface : fr.json (référence), en, it, es, de
supabase/           configuration et migrations de la base locale
tests/              tests unitaires (unit/) et de bout en bout (e2e/)
docs/               produit, architecture, données, design, risques, tâches manuelles
```

## Ajouter ou modifier un texte

1. Ajouter la clé dans `messages/fr.json`.
2. Ajouter la même clé, traduite, dans `en.json`, `it.json`, `es.json` et `de.json`.
3. `npm run test` vérifie que les 5 langues ont exactement les mêmes clés et les mêmes variables.

## Documentation

- Produit : [`docs/product/user-stories.md`](docs/product/user-stories.md)
- Architecture : [`docs/architecture.md`](docs/architecture.md), [`docs/system-design.md`](docs/system-design.md)
- Données : [`docs/data-model.md`](docs/data-model.md)
- Design : [`docs/design/design-system.md`](docs/design/design-system.md), [`docs/design/flows.md`](docs/design/flows.md)
- Décisions : [`DECISION_LOG.md`](DECISION_LOG.md) · Risques : [`docs/risks.md`](docs/risks.md)
- **Tâches à faire par le propriétaire du projet** : [`docs/manual-tasks.md`](docs/manual-tasks.md)
