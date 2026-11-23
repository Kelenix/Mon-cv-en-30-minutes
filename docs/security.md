# Sécurité — Mon CV en 30 Secondes (version Web)

> Rôle : security-engineer. Mis à jour à chaque incrément qui touche l'authentification, les
> données, les paiements ou un service tiers. Dernière revue : Inc-8 (LinkedIn, lettre), 23/11/2026.

## 1. Ce qui est protégé

| Bien | Où | Exposition |
|------|-----|-----------|
| Session de l'utilisateur | Cookies Supabase | Vol = prise de contrôle du compte |
| Profil (nom, téléphone, ville) | `public.profiles` | Données personnelles (RGPD) |
| E-mail du compte | `auth.users` | Donnée personnelle, identifiant de connexion |
| Clé secrète Supabase | Variables d'environnement du serveur | Contourne la RLS : accès à toute la base |
| Soldes et journal des crédits | `credit_wallets`, `credit_ledger` | Argent : crédits payés |
| Réponses aux questions et CV | `public.cvs`, brouillon dans le navigateur | Données personnelles (parcours, coordonnées) |
| Clé de l'API Anthropic | Variables d'environnement du serveur | Facturation à l'usage |
| Abonnements, achats, événements Stripe | `subscriptions`, `purchases`, `stripe_events` | Argent |
| Clés Stripe (secrète, webhooks) | Variables d'environnement du serveur | Paiements, remboursements |

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
| Lecture ou modification des CV d'un autre compte | RLS sur `cvs` (lecture, correction du titre et du contenu, suppression de ses seuls CV) ; un CV d'un autre compte est « introuvable » | `tests/db/cvs.test.ts`, `tests/e2e/creation.spec.ts` |
| CV créé sans génération, gratuité ou crédits contournés | Aucun privilège `insert` ; création, débit et remboursement par trois fonctions SQL réservées au serveur, chacune tout ou rien | `tests/db/cvs.test.ts` |
| Injection de consignes dans les réponses (R06) | Réponses encadrées par des balises et échappées, déclarées comme données ; sortie structurée validée par Zod et bornée avant l'enregistrement | Revue de code, `tests/unit/cv-content.test.ts` |
| Abus de la gratuité (H27) | 3 générations gratuites par jour et par IP hachée (HMAC, sel secret) ; une seule génération gratuite à la fois | `tests/db/cvs.test.ts` |
| Coûts de l'IA (rafales, textes énormes) | Limite par minute selon la formule, réponses limitées à 2 000 caractères, 16 000 tokens de sortie, délai de 60 s par tentative | `tests/db/cvs.test.ts`, `tests/unit/cv-content.test.ts` |
| Fuite de la clé Anthropic | Lue seulement côté serveur (`server-only`), jamais préfixée `NEXT_PUBLIC_`, obligatoire en production | Revue de code |
| Contenu des CV dans les journaux | Les erreurs journalisent un code et une cause technique, jamais les réponses ni le CV ; `ai_operations` ne contient aucun contenu | Revue de code |
| Téléchargement du CV d'un autre compte | Route d'export : session exigée (401), CV lu par le client soumis à la RLS (404) | `tests/e2e/exports.spec.ts` |
| Export sans filigrane ou DOCX sans droit | Droit vérifié côté serveur, filigrane posé par le serveur, DOCX refusé (403) | `tests/e2e/exports.spec.ts`, `tests/unit/export.test.ts` |
| CV exporté gardé en cache (navigateur partagé, proxy) | `Cache-Control: private, no-store` | Revue de code |
| Faux événement Stripe (crédits ou formule offerts) | Signature du webhook vérifiée sur le corps brut ; abonnement relu chez Stripe | `tests/unit/billing.test.ts` |
| Achat livré deux fois (Stripe réessaie) | Session de paiement unique dans `purchases`, événement noté, traitements idempotents | `tests/db/billing.test.ts` |
| Prix ou produit falsifié par le navigateur | Le serveur choisit le prix (clé du catalogue) ; montant et produit relus dans la session Stripe | Revue de code |
| Second abonnement, second essai, CV Pro déjà débloqué | Contrôles avant paiement (`CONFLICT`) ; essai consommé en base | `tests/e2e/paiements.spec.ts` |
| Crédits ou formule modifiés par l'utilisateur | Aucune écriture permise ; fonctions réservées au serveur | `tests/db/billing.test.ts` |
| Abonnement qui continue après la suppression du compte | Client Stripe supprimé avant le compte ; suppression refusée si Stripe échoue | Revue de code |
| Consigne cachée dans une annonce (« ignore les instructions… ») | Annonce encadrée et échappée, déclarée comme donnée ; CV adapté reconstruit par le serveur à partir de l'original : aucune expérience, compétence ou formation ajoutée | `tests/unit/cv-tools.test.ts` |
| Contenus générés d'un autre compte | RLS sur `generations` (lecture et correction du texte de ses seuls contenus) ; création réservée au serveur, rattachée à un CV du même compte | `tests/db/generations.test.ts` |
| Correction forgée d'un contenu généré (texte géant, autre type) | `updateGeneratedContent` revalide le texte avec le schéma du type (limites de LinkedIn, 10 000 caractères pour une lettre) ; adaptation, accroche et entretien non modifiables | `tests/unit/cv-tools.test.ts`, `tests/e2e/linkedin-lettre.spec.ts` |
| Version LinkedIn hors du CV (consigne cachée, expérience inventée) | Résultat reconstruit par le serveur à partir du CV : postes et entreprises du CV seulement | `tests/unit/cv-tools.test.ts` |
| Nouveau CV hors formule (requête forgée) | `applyAdaptation` en mode `new` refusé (`FORBIDDEN`) sans Pro ni Premium | Revue de code |
| Clickjacking, détection de type, fuite de référent | En-têtes : `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `next.config.ts` |

## 3. Points résiduels

| Point | Niveau | Suite |
|-------|--------|-------|
| Un scanner de liens de messagerie peut ouvrir le lien de l'e-mail avant l'utilisateur et l'invalider | Faible | Le code à 6 chiffres reste utilisable ; message clair si le lien a expiré |
| Politique de sécurité du contenu (CSP) encore partielle (pas de liste de scripts autorisés) | Moyen | CSP complète à l'Inc-12, quand Stripe et les publicités seront en place |
| Les limites locales de Supabase Auth sont relevées pour les tests | Faible | Valeurs par défaut conservées en production (tâche 2) |
| SMTP par défaut de Supabase inadapté à la production | Moyen | Fournisseur dédié (tâche 6, R15) |
| 4 vulnérabilités modérées dans la CLI shadcn (outil de développement) | Faible | Hors production ; la CI audite les dépendances de production |
| Plafond de CV gratuits par IP inactif sans `IP_HASH_SALT` | Faible | Sel obligatoire en production (le démarrage échoue sinon) |
| Deux souscriptions lancées en même temps sur un compte : deux abonnements chez Stripe | Faible | Contrôle avant paiement ; résiliation par le portail (ADR-029) |
| Paiements non encore vérifiés avec Stripe réel (clés de test absentes) | Moyen | Vérification complète dès la tâche 4 |
