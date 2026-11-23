# Journal de décisions (DECISION_LOG)

> ADR léger. Chaque décision structurante prise par Claude **en autonomie** y est consignée :
> contexte → décision → alternatives écartées → conséquences. Permet de tracer et de contester.
> Format inspiré des Architecture Decision Records. Le plus récent en haut.

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
- **Statut** : Accepté
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
