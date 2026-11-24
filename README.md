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
npm run db:status  # affiche API_URL, PUBLISHABLE_KEY et SECRET_KEY à reporter dans .env.local
npm run dev        # http://localhost:3000 → redirige vers la langue du navigateur
```

Connexion en local : saisir n'importe quelle adresse (ex. `moi@exemple.test`) sur la page de
connexion ; le code à 6 chiffres arrive dans Mailpit.

Outils locaux une fois Supabase démarré :

| Outil | Adresse |
|-------|---------|
| Supabase Studio (base de données) | http://localhost:54323 |
| Mailpit (e-mails de connexion) | http://localhost:54324 |

## IA en local

Sans `ANTHROPIC_API_KEY` dans `.env.local`, l'IA est **simulée** : le CV reprend les réponses
telles quelles (pratique pour développer et tester sans frais). Avec une clé (tâche manuelle 3),
les CV sont rédigés par Claude. Écrire `[simulation:echec]` dans le métier visé fait échouer une
génération simulée (pour voir l'écran d'erreur et le remboursement).

## Paiements en local (Stripe, mode test)

1. Mettre la clé de test `sk_test_…` dans `.env.local` (`STRIPE_SECRET_KEY`), puis
   `npm run stripe:seed` (produits, prix, portail ; le script refuse une clé réelle).
2. `docker compose --env-file .env.local run --rm stripe listen --print-secret` : copier le
   secret affiché dans `STRIPE_WEBHOOK_SECRET`, puis redémarrer `npm run dev`.
3. Pendant les essais : `docker compose --env-file .env.local up stripe` relaie les webhooks.
   Carte de test : `4242 4242 4242 4242`, date future, n'importe quel code.

Sans clé, les boutons d'achat affichent « Le paiement est momentanément indisponible ».

## Donner des crédits à un compte local

Les achats arrivent à l'Inc-6. En attendant, pour tester avec des crédits, dans Supabase Studio
(http://localhost:54323, éditeur SQL) :

```sql
select public.grant_credits(id, 'purchased', 10, 'pack_purchase')
from auth.users where email = 'moi@exemple.test';
```

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm run start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Génération des types de routes + TypeScript |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:db` | Règles d'accès (RLS) et fonctions SQL, contre Supabase local |
| `npm run test:e2e` | Tests de bout en bout (Playwright, ordinateur et mobile, audit d'accessibilité) — la première fois : `npx playwright install chromium` |
| `npm run verify` | Lint + types + format + tests unitaires + build |
| `npm run db:start` / `db:stop` / `db:reset` / `db:status` | Supabase local |
| `npm run db:types` | Régénère les types TypeScript de la base après une migration |

Un hook Git `pre-commit` formate et vérifie les fichiers modifiés, puis contrôle les types.

## Structure

```
src/app/[locale]/   pages (une version par langue, chemins traduits)
src/components/     composants d'interface (ui/ = shadcn/ui) et mise en page
src/i18n/           langues, routage, chargement des traductions
src/features/       fonctionnalités (auth, profile, plans, legal, marketing…)
src/lib/supabase/   clients Supabase (utilisateur, admin) et types de la base
src/core/           configuration (variables d'environnement validées), format des réponses
src/proxy.ts        langue, préfixe d'adresse, session et pages privées
messages/           textes de l'interface : fr.json (référence), en, it, es, de
supabase/           configuration, migrations et modèle d'e-mail de connexion
deploy/             production sur le VPS : Docker Compose, Caddy, image du site, scripts
tests/              tests unitaires (unit/), de la base (db/) et de bout en bout (e2e/)
docs/               produit, architecture, données, design, risques, tâches manuelles
```

## Mise en production

Le site et sa base tournent sur un VPS Hostinger, dans Docker (ADR-038). Pas-à-pas complet,
exploitation, sauvegardes et retour arrière : [`docs/deployment.md`](docs/deployment.md). Une
fois activé, chaque envoi sur `main` dont la CI est verte est mis en ligne automatiquement.

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
- Sécurité : [`docs/security.md`](docs/security.md) · Mise en production et exploitation : [`docs/deployment.md`](docs/deployment.md)
- **Tâches à faire par le propriétaire du projet** : [`docs/manual-tasks.md`](docs/manual-tasks.md)
