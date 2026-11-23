# System design — Mon CV en 30 Secondes (version Web)

> Phase 3 — rôle System Design. Date : 23/11/2026.
> Contrats des actions et routes, flux critiques, cache, pagination, résilience.
> Architecture : `docs/architecture.md`. Données : `docs/data-model.md`.

---

## 1. Format commun des réponses

Toute Server Action renvoie :

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: Record<string, string> } };
```

Une action qui termine par une redirection (`redirect()`) ne renvoie rien en cas de succès.
Toute entrée est validée par un schéma Zod partagé entre le formulaire et le serveur ; le serveur
revalide toujours.

## 2. Codes d'erreur

Les messages sont traduits dans les 5 langues (clé de traduction = code d'erreur) ; exemples en
français ci-dessous.

| Code | Sens | Message affiché (exemple) |
|------|------|---------------------------|
| `UNAUTHENTICATED` | Session absente ou expirée | « Ta session a expiré. Reconnecte-toi pour continuer. » |
| `FORBIDDEN` | Ressource d'un autre utilisateur ou action interdite | « Tu n'as pas accès à ce contenu. » |
| `VALIDATION_ERROR` | Entrée invalide (`details` par champ) | « Vérifie les champs signalés. » |
| `NOT_FOUND` | Ressource absente | « Ce CV est introuvable. » |
| `FEATURE_LOCKED` | Fonction non incluse dans les droits | « Cette fonction se débloque avec Pro ou avec des crédits achetés. » |
| `INSUFFICIENT_CREDITS` | Solde insuffisant | « Il te manque des crédits pour cette action. » |
| `CV_LIMIT_REACHED` | Nombre de CV conservés atteint (H12, H22) | « Choisis le CV à remplacer. » |
| `RATE_LIMITED` | Trop d'opérations rapprochées | « Patiente quelques secondes avant de relancer. » |
| `FREE_LIMIT_REACHED` | Plafond de CV gratuits par adresse IP atteint (H27) | « Limite de CV gratuits atteinte pour aujourd'hui. » |
| `AI_UNAVAILABLE` | Erreur ou délai dépassé côté IA (crédits rendus) | « La génération n'a pas abouti. Tes crédits ont été rendus. Réessaie. » |
| `AI_INVALID_OUTPUT` | Réponse IA invalide après contrôle (crédits rendus) | Même message |
| `CONFLICT` | État incompatible (déjà abonné, essai déjà utilisé, jeton déjà utilisé…) | Message propre au cas |
| `PAYMENT_ERROR` | Stripe indisponible | « Le paiement est momentanément indisponible. » |
| `INTERNAL` | Erreur inattendue (journalisée avec un identifiant) | « Une erreur est survenue. Réessaie dans un instant. » |

---

## 3. Contrats des Server Actions

`requestId` : identifiant (uuid) généré par le navigateur à chaque clic ; il rend les opérations
IA idempotentes (un double clic ou un rejeu ne débite qu'une fois).

### Authentification et profil (Inc-2)

| Action | Entrée | Sortie | Erreurs |
|--------|--------|--------|---------|
| `requestEmailCode` | `email`, `next?` (chemin interne) | `{ sent: true }` | `VALIDATION_ERROR`, `RATE_LIMITED` |
| `verifyEmailCode` | `email`, `code` (6 chiffres), `next?` | redirection vers `next` ou `/compte` (vers `/bienvenue?next=…` tant que le nom manque) | `VALIDATION_ERROR` (« Code invalide ou expiré ») |
| `signInWithGoogle` | `next?` | redirection vers Google | `INTERNAL` |
| `signOut` | — | redirection vers `/` | — |
| `completeProfile` | `firstName`, `lastName` (1 à 60), `locale`, `next?` | redirection vers `next` ou `/compte` | `UNAUTHENTICATED`, `VALIDATION_ERROR` |
| `updateProfile` | `firstName`, `lastName` (1 à 60), `phone?` (≤ 30), `city?` (≤ 80) | profil | `UNAUTHENTICATED`, `VALIDATION_ERROR` |
| `saveLocalePreference` | `locale` | — (sans effet pour un visiteur) | — |
| `deleteAccount` | `confirmation` = « SUPPRIMER » | redirection vers `/?compte=supprime` | `UNAUTHENTICATED`, `VALIDATION_ERROR`, `PAYMENT_ERROR` |

`next` n'accepte que des chemins internes commençant par `/` (pas de redirection ouverte).

### CV (Inc-4, Inc-10)

| Action | Entrée | Sortie | Erreurs |
|--------|--------|--------|---------|
| `generateCv` | `requestId`, `answers` (voir §4), `language` (langue du CV, défaut : langue de l'interface), `replaceCvId?` | `{ cvId }` | `UNAUTHENTICATED`, `VALIDATION_ERROR`, `CV_LIMIT_REACHED` (avec la liste des CV), `INSUFFICIENT_CREDITS`, `RATE_LIMITED`, `FREE_LIMIT_REACHED`, `AI_UNAVAILABLE`, `AI_INVALID_OUTPUT` |
| `updateCv` | `cvId`, `content` (schéma `CvContent`) | `{ updatedAt }` | `UNAUTHENTICATED`, `VALIDATION_ERROR`, `NOT_FOUND` |
| `deleteCv` | `cvId` | `{ deleted: true }` (CV et contenus générés supprimés ; achat CV Pro conservé) | `UNAUTHENTICATED`, `VALIDATION_ERROR`, `NOT_FOUND` |

### Outils IA (Inc-7 à Inc-9)

Toutes : `UNAUTHENTICATED`, `VALIDATION_ERROR`, `NOT_FOUND`, `INSUFFICIENT_CREDITS` (avec
`cost`, `missing` et `purchasedOnly` pour Essential), `RATE_LIMITED` (dont une demande rejouée),
`AI_UNAVAILABLE`, `AI_INVALID_OUTPUT`. Aucune fonction n'est fermée par la matrice : tout se paie
au moins en crédits achetés (ADR-030).
Toutes les actions qui génèrent du texte acceptent `language?` (défaut : langue du CV, H30).

| Action | Entrée | Sortie | Coût |
|--------|--------|--------|------|
| `improveExperience` | `requestId`, `cvId`, `experienceId` (avec au moins une mission) | `{ proposal }` (puces réécrites) | 1 |
| `improveSummary` | `requestId`, `cvId` | `{ generationId, variants }` (3 ou 5) | 1 |
| `adaptToJob` | `requestId`, `cvId`, `jobPosting` (50 à 10 000), `language` | `{ generationId, content, missingKeywords }` | 2 |
| `applyAdaptation` | `generationId`, `mode` : `replace` \| `new`, `locale` (titre du nouveau CV) | `{ cvId }` (+ `FORBIDDEN` si `new` hors Pro/Premium) | 0 |
| `generateLinkedin` | `requestId`, `cvId`, `language` | `{ generationId, output: { headline, about, experiences[] } }` (une description par expérience du CV ; 220, 2 600 et 2 000 caractères au plus) | 1 |
| `generateCoverLetter` | `requestId`, `cvId`, `position` (2 à 120), `company?` (≤ 120), `jobPosting?` (≤ 10 000), `language` | `{ generationId, output: { letter } }` | 2 |
| `startInterview` | `requestId`, `cvId`, `position` (2 à 120), `language` | `{ generationId, questions }` (8) | 2 |
| `submitInterviewAnswers` | `requestId`, `generationId`, `answers` (8, vides permises, au moins une ; ≤ 2 000 chacune) | `{ feedback }` (une entrée par question répondue ; `CONFLICT` si déjà évalué) | 0 (opération journalisée et limitée) |
| `updateGeneratedContent` | `generationId`, `output` (revalidé avec le schéma du type ; seuls LinkedIn et lettre se modifient) | `{ updatedAt }` | 0 |

### Paiements (Inc-6, Inc-11)

| Action | Entrée | Sortie | Erreurs |
|--------|--------|--------|---------|
| `createCheckoutSession` | `locale`, `item` (pack `credits_*`, `cvPro` + `cvId`, ou formule `tier` + `interval` + `trial?`), `returnTo?` (`credits` ou `generation`) | `{ url }` | `UNAUTHENTICATED`, `VALIDATION_ERROR`, `NOT_FOUND` (CV), `CONFLICT` avec `reason` (`subscribed`, `trialUsed`, `cvUnlocked`), `PAYMENT_ERROR` ; retrait des pubs : Inc-11 |
| `openBillingPortal` | — | `{ url }` | `UNAUTHENTICATED`, `NOT_FOUND` (aucun client Stripe), `PAYMENT_ERROR` |

### Publicités (Inc-11)

| Action | Entrée | Sortie | Erreurs |
|--------|--------|--------|---------|
| `issueRewardToken` | — | `{ token }` | `UNAUTHENTICATED`, `FORBIDDEN` (abonné), `RATE_LIMITED` (3 par jour) |
| `redeemRewardToken` | `token` | `{ purchasedBalance }` | `UNAUTHENTICATED`, `CONFLICT` (déjà utilisé ou expiré) |
| `markInterstitialShown` | — | `{ ok: true }` | `UNAUTHENTICATED` |

## 4. Schémas de données partagés

```ts
// Langues proposées (ADR-018)
Locale = "fr" | "en" | "it" | "es" | "de";

// Réponses aux 5 questions (H19), dans n'importe quelle langue
CvAnswers = {
  job: string;          // 2 à 2 000, obligatoire
  experiences: string;  // 0 à 2 000
  skills: string;       // 0 à 2 000
  education: string;    // 0 à 2 000
  goal: string;         // 0 à 2 000
};

// Contenu structuré du CV (sortie de l'IA, puis modifié par l'utilisateur)
CvContent = {
  header: { fullName: string; title: string; email?: string; phone?: string; city?: string };
  summary: string;                                   // ≤ 600
  experiences: {                                     // ≤ 15
    id: string; role: string; company: string; location?: string;
    startDate?: string; endDate?: string;            // texte libre (« 2021 », « Aujourd'hui »)
    bullets: string[];                               // ≤ 8, chacune ≤ 300
  }[];
  skills: string[];                                  // ≤ 40, chacune ≤ 60
  education: { id: string; degree: string; school: string; year?: string; details?: string }[]; // ≤ 10
  languages: { id: string; name: string; level?: string }[];                                     // ≤ 10
};
```

Les dates restent du texte libre : l'IA ne doit pas inventer de mois ou d'année absents des
réponses (R05). La langue du contenu est stockée à côté (`cvs.language`) ; les titres de sections
(« Expériences », « Experience », « Esperienze »…) viennent des traductions de l'application.

## 5. Route Handlers

| Route | Méthode | Entrée | Réponse | Erreurs |
|-------|---------|--------|---------|---------|
| `/auth/callback` | GET | `code`, `next?` (retour de Google) | redirection | redirection vers `/connexion?erreur=google` |
| `/auth/confirm` | GET | `token_hash`, `next?` (lien de l'e-mail) | redirection | redirection vers `/connexion?erreur=lien` |
| `/api/cv/[id]/export` | GET | `format` = `pdf` \| `docx` | fichier en pièce jointe (`CV-Prénom-Nom.pdf`) | 400 format, 401, 403 (`docx` sans droit), 404 |
| `/api/me/wallet` | GET | `session_id?` | `{ included, purchased, plan, nextGrantAt, renewsAt, purchaseConfirmed }` | 401 |
| `/api/stripe/webhook` | POST | corps brut + en-tête de signature | 200 | 400 signature invalide ; 500 → Stripe réessaie |
| `/api/cron/retention` | GET | `Authorization: Bearer CRON_SECRET` | `{ warned, deleted }` | 401 |

---

## 6. Flux critiques

### 6.1 Créer son premier CV (US-10, US-04, US-11)

```mermaid
sequenceDiagram
  actor U as Visiteur
  participant B as Navigateur
  participant N as Next.js
  participant DB as Supabase
  participant AI as Claude
  U->>B: Répond aux 5 questions (/creer)
  B->>B: Brouillon dans localStorage
  U->>B: « Générer mon CV »
  B->>N: GET /creer/generation
  N-->>B: Non connecté → /connexion?next=/creer/generation
  U->>N: requestEmailCode(email) puis verifyEmailCode(code)
  N->>DB: Vérifie le code, crée la session (profil + portefeuille créés par déclencheur)
  N-->>B: Redirection /creer/generation (prénom et nom demandés si absents)
  B->>N: generateCv(requestId, answers)
  N->>DB: Utilisateur, droits, limites (débit, IP), CV conservés
  N->>DB: ai_operations « en cours » (requestId unique)
  alt Génération gratuite déjà utilisée
    N->>DB: spend_credits(1) — verrou, inclus puis achetés
  end
  N->>AI: Prompt + réponses (données encadrées), sortie structurée
  alt Succès et sortie valide
    N->>DB: Crée le CV, marque la gratuité utilisée, opération « réussie » + coûts
    N-->>B: { cvId } → efface le brouillon → /cv/{cvId}
  else Échec ou sortie invalide
    N->>DB: refund_operation, opération « échouée »
    N-->>B: AI_UNAVAILABLE (réponses conservées)
  end
```

### 6.2 Acheter un pack de crédits (US-18)

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant N as Next.js
  participant S as Stripe
  participant DB as Supabase
  U->>N: createCheckoutSession(credits_15)
  N->>S: Crée la session (client Stripe, métadonnées user_id + produit, conditions obligatoires)
  N-->>U: Redirection vers Stripe Checkout
  U->>S: Paie et accepte les conditions
  S-->>U: Retour /compte/credits?paiement=ok
  S->>N: Webhook checkout.session.completed (signé)
  N->>DB: Événement déjà traité ? → 200 sans rien faire
  N->>DB: fulfill_purchase : purchases (session unique) + crédits achetés
  N->>DB: Note l'événement (après traitement : un échec laisse Stripe réessayer)
  U->>N: Interroge /api/me/wallet toutes les 1,5 s (10 s max)
  N-->>U: Nouveau solde affiché
```

### 6.3 Abonnement, essai et remise mensuelle (US-20, US-21, US-23)

```mermaid
sequenceDiagram
  participant S as Stripe
  participant N as Next.js (webhook)
  participant DB as Supabase
  participant C as pg_cron
  S->>N: customer.subscription.created (essai)
  N->>S: Relit l'abonnement (état à jour)
  N->>DB: subscriptions (pro, trialing), trial_used_at, crédits inclus = 10
  S->>N: customer.subscription.updated (trialing → active)
  N->>DB: crédits inclus = 60, prochaine remise = +1 mois
  loop Toutes les heures
    C->>DB: run_monthly_grants() : abonnements actifs dont la remise est due
    DB->>DB: inclus = quota (journal : expiration + remise), prochaine remise += 1 mois
  end
  S->>N: customer.subscription.updated (montée Essential → Pro)
  N->>DB: formule pro, quota 60, inclus = 60 immédiatement (H25)
  S->>N: customer.subscription.deleted
  N->>DB: statut canceled, crédits inclus = 0 (achetés conservés)
```

### 6.4 Exporter le CV (US-16, US-17)

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant N as Next.js (route d'export)
  participant DB as Supabase
  U->>N: GET /api/cv/{id}/export?format=pdf
  N->>DB: Lit le CV avec le client soumis à la RLS (404 si absent ou d'un autre)
  N->>DB: Droits : abonnement actif ? CV Pro ?
  alt Aucun droit
    N-->>U: PDF avec filigrane (DOCX → 403)
  else Droit sans filigrane
    N-->>U: PDF sans filigrane ou DOCX
  end
```

### 6.5 Supprimer son compte (US-06)

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant N as Next.js
  participant S as Stripe
  participant DB as Supabase
  U->>N: deleteAccount("SUPPRIMER")
  N->>DB: Lit l'abonnement
  opt Abonnement actif
    N->>S: Résiliation immédiate
  end
  N->>DB: auth.admin.deleteUser → cascade sur toutes les tables de l'utilisateur
  N-->>U: Déconnexion, redirection vers l'accueil
```

### 6.6 Rétention des comptes inactifs (US-40)

```mermaid
sequenceDiagram
  participant V as Vercel Cron (quotidien)
  participant N as /api/cron/retention
  participant DB as Supabase
  participant M as SMTP
  V->>N: GET + CRON_SECRET
  N->>DB: Comptes sans abonnement actif, dernière activité < aujourd'hui − 3 ans + 30 j, non avertis
  N->>M: E-mail d'avertissement ; enregistre la date d'envoi
  N->>DB: Comptes avertis depuis ≥ 30 j et toujours inactifs
  N->>DB: auth.admin.deleteUser (cascade)
```

---

## 7. Cache et fraîcheur des données

| Donnée | Stratégie |
|--------|-----------|
| Accueil, tarifs, pages légales | Générées au build ; changent uniquement à un nouveau déploiement |
| Données d'un utilisateur (CV, crédits, formule) | Rendu dynamique à chaque requête, jamais mises en cache partagé |
| Après une mutation | `revalidatePath` de la page concernée, ou `router.refresh()` côté client |
| Solde affiché après une opération IA | L'action relit la page (`refresh()` de next/cache) quand des crédits ont été débités (ADR-027) |
| Solde après un paiement | Requête `['wallet']` interrogée toutes les 1,5 s pendant 10 s au maximum |
| Éditeur de CV | Enregistrement automatique 1 s après la dernière frappe (action `updateCv`, envois ordonnés), indicateur « Enregistrement… / Enregistré » |

## 8. Pagination et tri

Seule liste qui grandit : l'historique des CV (Pro, Premium). Pagination **par curseur**
(`updated_at` décroissant, puis `id`), 20 éléments par page, bouton « Charger plus ».
Les contenus générés d'un CV sont listés du plus récent au plus ancien, 20 par page.

## 9. Résilience

| Point | Règle |
|-------|-------|
| Appels IA | Délai maximal 60 s ; une nouvelle tentative sur erreur transitoire (429, 5xx, réseau) ; jamais sur 4xx |
| Opérations IA | `requestId` unique en base → aucun double débit ; crédits rendus automatiquement en cas d'échec |
| Webhooks Stripe | Signature vérifiée ; identifiant d'événement unique ; état relu depuis Stripe (ordre des événements indifférent) ; réponse 500 en cas d'erreur pour que Stripe réessaie |
| Achats | Identifiant de session Checkout unique dans `purchases` |
| Remise mensuelle | Condition sur la date de prochaine remise ; rejouable sans effet |
| Rétention | Avertissement et suppression conditionnés par des dates stockées ; rejouables |
| Appels Stripe sortants | Délai 20 s, deux nouvelles tentatives (SDK) |

## 10. Limites de débit

| Statut | Opérations IA par minute |
|--------|--------------------------|
| Sans abonnement | 3 |
| Essential | 5 |
| Pro (et essai) | 10 |
| Premium | 20 |

Calculées à partir de `ai_operations` (aucun service supplémentaire). Générations gratuites :
3 par jour et par adresse IP hachée (H27). Codes e-mail : limites de Supabase Auth, réglées dans
`supabase/config.toml`.

## 11. États d'écran

Chaque vue gère quatre états (chargement, vide, erreur, succès), spécifiés écran par écran dans
`docs/design/flows.md`.
