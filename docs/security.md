# Sécurité — Mon CV en 30 Secondes (version Web)

> Rôle : security-engineer. Mis à jour à chaque incrément qui touche l'authentification, les
> données, les paiements ou un service tiers. Dernière revue : Inc-3 (crédits), 23/11/2026.

## 1. Ce qui est protégé

| Bien | Où | Exposition |
|------|-----|-----------|
| Session de l'utilisateur | Cookies Supabase | Vol = prise de contrôle du compte |
| Profil (nom, téléphone, ville) | `public.profiles` | Données personnelles (RGPD) |
| E-mail du compte | `auth.users` | Donnée personnelle, identifiant de connexion |
| Clé secrète Supabase | Variables d'environnement du serveur | Contourne la RLS : accès à toute la base |
| Soldes et journal des crédits | `credit_wallets`, `credit_ledger` | Argent : crédits payés |
| À venir : CV, abonnements, achats | Inc-4 à Inc-6 | Données personnelles, argent |

## 2. Menaces et parades en place (Inc-2)

| Menace | Parade | Vérifiée par |
|--------|--------|--------------|
| Lecture ou modification des données d'un autre compte | RLS sur `profiles` (lecture et modification de sa seule ligne), aucun privilège pour les visiteurs anonymes | `tests/db/profiles.test.ts` |
| Modification de champs réservés (client Stripe, indicateurs de gratuité, d'essai, de pubs, activité) | Privilège `update` accordé colonne par colonne (`first_name`, `last_name`, `phone`, `city`, `locale`) | `tests/db/profiles.test.ts` |
| Création ou suppression directe de profils | Aucun privilège `insert` / `delete` ; création par déclencheur, suppression en cascade du compte | `tests/db/profiles.test.ts` |
| Vol de session par un script injecté (XSS) | Cookies `HttpOnly` (aucun client Supabase dans le navigateur), `SameSite=Lax`, `Secure` en HTTPS ; React échappe tout texte affiché | Configuration `src/lib/supabase/cookie-options.ts` |
| Contournement des pages privées | Proxy + revérification de la session dans chaque page (`requireUser`) et chaque action (`getCurrentUserId`) | `tests/e2e/comptes.spec.ts` |
| Redirection ouverte après connexion (`next=https://site-pirate…`) | `safeNextPath` : adresses internes uniquement | `tests/unit/auth-paths.test.ts`, `tests/e2e/comptes.spec.ts` |
| Entrées malveillantes ou invalides | Validation Zod côté serveur de chaque action, contraintes `check` en base | `tests/unit/profile.test.ts`, `tests/db/profiles.test.ts` |
| Falsification de requête (CSRF) | Server Actions de Next.js (vérification de l'origine), cookies `SameSite=Lax` | Next.js |
| Essais de codes en rafale, envoi massif d'e-mails | Limites de Supabase Auth par IP et par adresse ; code valable 1 heure ; erreur `RATE_LIMITED` affichée | Supabase |
| Fuite de la clé secrète | Lue seulement dans `src/lib/supabase/admin.ts` (`server-only`), jamais préfixée `NEXT_PUBLIC_` ; `.env*` ignorés par Git | Revue de code |
| Suppression de compte par erreur ou par un tiers | Session exigée, mot de confirmation revalidé côté serveur | `tests/e2e/comptes.spec.ts` |
| Données personnelles dans les journaux | Les erreurs journalisent un code, jamais l'e-mail ni le contenu | Revue de code |
| Mise en cache d'une page personnelle | `connection()` avant tout accès à la session : jamais pré-rendue ni partagée ; pages privées en `noindex` | Build (rendu partiel) |
| Crédits ajoutés ou modifiés par l'utilisateur | Aucun privilège d'écriture sur les soldes et le journal ; fonctions de crédit exécutables par le seul rôle serveur | `tests/db/credits.test.ts` |
| Double débit, solde négatif (opérations simultanées, double clic) | Verrou de ligne sur l'opération et le portefeuille ; une opération n'est débitée qu'une fois ; contrainte `>= 0` | `tests/db/credits.test.ts` (20 débits simultanés) |
| Journal falsifié après coup | Déclencheur qui refuse toute modification ; somme du journal = solde (NFR-08) | `tests/db/credits.test.ts` |
| Clickjacking, détection de type, fuite de référent | En-têtes : `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `next.config.ts` |

## 3. Points résiduels

| Point | Niveau | Suite |
|-------|--------|-------|
| Un scanner de liens de messagerie peut ouvrir le lien de l'e-mail avant l'utilisateur et l'invalider | Faible | Le code à 6 chiffres reste utilisable ; message clair si le lien a expiré |
| Politique de sécurité du contenu (CSP) encore partielle (pas de liste de scripts autorisés) | Moyen | CSP complète à l'Inc-12, quand Stripe et les publicités seront en place |
| Les limites locales de Supabase Auth sont relevées pour les tests | Faible | Valeurs par défaut conservées en production (tâche 2) |
| SMTP par défaut de Supabase inadapté à la production | Moyen | Fournisseur dédié (tâche 6, R15) |
| 4 vulnérabilités modérées dans la CLI shadcn (outil de développement) | Faible | Hors production ; la CI audite les dépendances de production |
