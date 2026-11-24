# Sécurité — Mon CV en 30 Secondes (version Web)

> Rôle : security-engineer. Mis à jour à chaque incrément qui touche l'authentification, les
> données, les paiements ou un service tiers. Dernière revue : Inc-13 (production sur VPS, rétention des comptes, revue finale), 24/11/2026.

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
| Configuration du serveur (`deploy/.env` : mot de passe de la base, secret JWT, toutes les clés) | VPS, droits 600, utilisateur `deploy` | Accès complet aux données et aux services |
| Sauvegardes de la base | `/var/backups/mon-cv` (droits 700/600), copies hors serveur | Toutes les données personnelles |

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
| Robots : envoi massif d'e-mails de connexion, comptes créés en série (CV gratuit, coût de l'IA) | Cloudflare Turnstile vérifié côté serveur à chaque envoi de code (jeton à usage unique, refus si absent ou invalide) ; 10 demandes de code par heure et par IP ; 1 e-mail par minute et par adresse ; plafond horaire global d'e-mails ; API Supabase fermée au public (ADR-039) | `tests/db/rate-limits.test.ts` ; vérifié dans le navigateur avec les clés de test Cloudflare (jeton accepté, refusé, plafond par IP) |
| Essai de tous les codes à 6 chiffres | 10 essais par heure et par adresse e-mail, quel que soit le nombre d'adresses IP de l'attaquant, et 30 par IP ; code valable 1 heure | `tests/db/rate-limits.test.ts` |
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
| Crédits gagnés sans regarder l'annonce (requêtes forgées) | Jeton à usage unique émis par le serveur, échangé de 5 s à 15 min après, 3 crédits par 24 h, 30 jetons par jour, fonctions réservées au serveur ; Google ne vérifie pas la récompense côté serveur sur le web : risque borné accepté (ADR-036) | `tests/db/rewards.test.ts` |
| Traceurs publicitaires sans consentement | Scripts Google chargés seulement sur les pages à annonces, pour les comptes concernés, bandeau certifié chargé avant la bibliothèque Ad Manager ; aucun script pour un abonné ou après le retrait | `tests/e2e/publicites.spec.ts` |
| Retrait des publicités acheté deux fois ou hors option | `CONFLICT` si déjà retiré, `FORBIDDEN` si l'option est désactivée ; livraison idempotente par le webhook | `tests/unit/billing.test.ts` |
| Suppression du CV d'un autre compte | `deleteCv` passe par le client soumis à la RLS : un CV d'un autre compte est introuvable (`NOT_FOUND`) | `tests/db/cvs.test.ts` |
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
| Contenus générés d'un autre compte | RLS sur `generations` (lecture de ses seuls contenus ; correction du texte de sa version LinkedIn et de sa lettre seulement) ; création réservée au serveur, rattachée à un CV du même compte | `tests/db/generations.test.ts` |
| Correction forgée d'un contenu généré (texte géant, autre type) | `updateGeneratedContent` revalide le texte avec le schéma du type (limites de LinkedIn, 10 000 caractères pour une lettre) ; adaptation, accroche et entretien non modifiables | `tests/unit/cv-tools.test.ts`, `tests/e2e/linkedin-lettre.spec.ts` |
| Version LinkedIn hors du CV (consigne cachée, expérience inventée) | Résultat reconstruit par le serveur à partir du CV : postes et entreprises du CV seulement | `tests/unit/cv-tools.test.ts` |
| Retour d'entretien gratuit rejoué (coût de l'IA sans débit) | Un seul retour par simulation : réponses écrites par le serveur seul, `CONFLICT` ensuite ; opération journalisée et soumise à la limite par minute | `tests/db/generations.test.ts`, `tests/e2e/entretien.spec.ts` |
| Consigne cachée dans une réponse d'entretien | Questions et réponses encadrées, échappées et déclarées comme données ; retour gardé seulement pour les questions répondues | `tests/unit/cv-tools.test.ts` |
| Nouveau CV hors formule (requête forgée) | `applyAdaptation` en mode `new` refusé (`FORBIDDEN`) sans Pro ni Premium | Revue de code |
| Clickjacking, détection de type, fuite de référent | En-têtes : `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `next.config.ts` |
| Script ou ressource venant d'un autre domaine (XSS, injection) | Content-Security-Policy : site et Supabase seulement (plus `challenges.cloudflare.com` pour Turnstile), aucun autre cadre ni objet, `base-uri 'self'`, formulaires vers le site, Supabase et Google ; `https:` ouvert seulement en mode `ADS_MODE=google` (ADR-037) | `tests/e2e/audit.spec.ts` (aucune ressource refusée) |
| Balise injectée par les données structurées | JSON produit par le serveur à partir du catalogue, sans donnée saisie ; `<` échappé | Revue de code |
| Accès direct à la base ou à l'administration depuis Internet | Seuls SSH, 80 et 443 ouverts (pare-feu) ; PostgreSQL sur un réseau Docker sans le site ni accès extérieur ; Studio lié à `127.0.0.1`, par tunnel SSH seulement | `deploy/docker-compose.yml`, répétition locale (ADR-038) |
| Appels directs à l'API Supabase (inscription en rafale, lecture de données) contournant le site | `api.domaine` n'accepte sans clé que la connexion Google ; le reste exige la clé du serveur, jamais envoyée au navigateur ; RLS et privilèges en plus | `deploy/scripts/smoke-test.sh` (401 sans clé, 401 sans session) |
| Tâche planifiée déclenchée par un tiers | `/api/cron/*` fermé au public par Caddy (404) ; jeton `CRON_SECRET` comparé en temps constant (401) | `tests/e2e/exploitation.spec.ts`, `smoke-test.sh` |
| Usurpation de l'adresse IP (plafond de CV gratuits) | nginx pose `X-Real-IP` avec l'adresse de la connexion ; Caddy, joignable seulement par `127.0.0.1`, ne reprend cet en-tête que d'un proxy du serveur et le réécrit pour le site (ADR-044) | `deploy/Caddyfile`, essai local avec un en-tête falsifié |
| Secret dans l'image ou les journaux du déploiement | Le build ne reçoit que des valeurs publiques ; secrets donnés au démarrage ; `.env*` exclus de l'image (`.dockerignore`) | Image inspectée (aucun fichier `.env`) |
| Mise en ligne d'une version cassée ou mal configurée | Variables validées au démarrage (`instrumentation.ts`), sonde de santé, vérifications après déploiement, retour automatique à l'image précédente | Répétition locale (variable manquante → retour) |
| Accès SSH par force brute | Clés uniquement (mot de passe désactivé), fail2ban ; clé GitHub limitée par commande imposée à `deploy.sh`, version validée | `deploy/scripts/setup-vps.sh` |
| Faille d'un composant du serveur | Mises à jour de sécurité Ubuntu automatiques ; images à version fixée, mises à jour par commit (`docs/deployment.md` §13) | Revue |
| Accès à l'administration par un compte ordinaire | Liste `ADMIN_EMAILS` sur le serveur ; proxy (connexion exigée, page introuvable sinon), puis chaque page et chaque action revérifient ; fonctions `admin_*` et tables réservées au rôle serveur | `tests/e2e/administration.spec.ts`, `tests/db/admin.test.ts` |
| Abus d'un administrateur, action par erreur | Journal de chaque action (auteur, compte, détail) gardé un an ; suppression confirmée par l'e-mail du compte ; jamais sur son propre compte | `tests/e2e/administration.spec.ts` |
| Statistiques de visites trop intrusives | Compteurs par jour, sans cookie, sans adresse IP, sans lien avec un compte ; pays seul à la première connexion | `tests/db/admin.test.ts` |
| Compte inactif conservé indéfiniment (RGPD) | Avertissement à 3 ans moins 30 jours, suppression 30 jours après, jamais pour un abonné ; fonctions réservées au serveur ; prénom échappé dans l'e-mail | `tests/db/retention.test.ts`, `tests/unit/retention-email.test.ts` |

## 3. Points résiduels

| Point | Niveau | Suite |
|-------|--------|-------|
| Un scanner de liens de messagerie peut ouvrir le lien de l'e-mail avant l'utilisateur et l'invalider | Faible | Le code à 6 chiffres reste utilisable ; message clair si le lien a expiré |
| CSP avec `'unsafe-inline'` pour les scripts (pages générées à l'avance, sans nonce) | Faible | React échappe tout contenu ; aucune donnée saisie insérée en HTML brut (ADR-037) |
| En mode `ADS_MODE=google`, scripts, images, connexions et cadres ouverts à tout domaine HTTPS | Moyen | Exigé par Ad Manager et son bandeau ; à resserrer avec la liste des domaines observés une fois les annonces en ligne (tâche 10) |
| Toutes les requêtes d'authentification viennent du serveur du site : les limites par IP de GoTrue sont relevées et agissent comme limites globales | Faible | Plafonds par IP et par adresse e-mail calculés par le site, Turnstile (ADR-039) |
| Robot capable de résoudre Turnstile avec de nombreuses adresses IP | Faible | Plafond horaire global d'e-mails, 3 CV gratuits par IP et par jour, limites de l'IA par minute ; surveiller Resend et le coût de l'IA |
| SMTP : e-mails de connexion indispensables | Moyen | Fournisseur dédié et domaine authentifié (tâche 6, R15) |
| Base, sauvegardes et site sur un même VPS : la perte du serveur perd les sauvegardes locales | Moyen | Sauvegardes Hostinger et copie hors serveur (tâche 15) |
| VPS partagé avec d'autres sites (même nginx, même Docker, même utilisateur `deploy`) : une faille de l'un peut atteindre les autres ; connexion root par mot de passe encore ouverte | Moyen | Réseaux Docker et base propres au site ; fermer la connexion SSH par mot de passe ; VPS dédié si l'activité grandit (ADR-044) |
| Exploitation du serveur (mises à jour des images Supabase, Caddy, Node) à la charge de l'exploitant | Moyen | Procédure dans `docs/deployment.md` §13 ; vérifier les avis de sécurité une fois par mois |
| Accès à l'administration protégé par la seule boîte e-mail de l'administrateur (code de connexion) | Moyen | Double authentification sur la boîte e-mail (tâche 17) ; double authentification propre au site envisageable ensuite |
| Clés Supabase en HS256 : `getClaims` vérifie le jeton auprès de l'authentification à chaque requête | Faible | Appel interne au VPS (quelques millisecondes) |
| 4 vulnérabilités modérées dans la CLI shadcn (outil de développement) | Faible | Hors production ; la CI audite les dépendances de production |
| Plafond de CV gratuits par IP inactif sans `IP_HASH_SALT` | Faible | Sel obligatoire en production (le démarrage échoue sinon) |
| Deux souscriptions lancées en même temps sur un compte : deux abonnements chez Stripe | Faible | Contrôle avant paiement ; résiliation par le portail (ADR-029) |
| Paiements non encore vérifiés avec Stripe réel (clés de test absentes) | Moyen | Vérification complète dès la tâche 4 |
