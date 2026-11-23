# Design system — Mon CV en 30 Secondes (version Web)

> Phase 3 — rôle UI/UX Designer. Date : 23/11/2026.
> Source : INTAKE §2 et kit UI web (ADR-003). Tokens centralisés dans `src/app/globals.css`
> (bloc `@theme` de Tailwind 4) ; aucune valeur de couleur, de taille ou d'ombre en dur dans les
> composants.

---

## 1. Principes

- Moderne, premium, minimaliste, **lumineux** : dominante blanche, surfaces bleu clair.
- Bleu principal pour les actions ; jaune réservé aux accents et au Premium ; bleu nuit pour le
  texte.
- Dégradé bleu → cyan **avec modération** (hero, illustrations), jamais sous du texte courant.
- Cartes arrondies, ombres légères, transitions courtes.
- **Thème clair uniquement** : l'INTAKE demande d'éviter les interfaces sombres (ADR-016).

---

## 2. Couleurs

Contrastes calculés selon la formule WCAG 2.2 (texte normal : 4,5:1 minimum ; grand texte et
éléments d'interface : 3:1).

| Token | Valeur | Usage | Contraste |
|-------|--------|-------|-----------|
| `background` | `#FFFFFF` | Fond principal | — |
| `surface` | `#E6F0FF` | Fonds secondaires, sections alternées | — |
| `foreground` | `#0B1F3A` (bleu nuit) | Titres et texte | 16,5:1 sur blanc, 14,4:1 sur `surface` |
| `muted-foreground` | `#4A5B73` | Texte secondaire, aides | 6,9:1 sur blanc, 6,0:1 sur `surface` |
| `primary` | `#0F6FE6` (bleu principal) | Boutons principaux, éléments actifs | Texte blanc dessus : 4,7:1 |
| `primary-strong` | `#0A58BD` | Liens dans le texte, survol des boutons | 6,7:1 sur blanc, 5,8:1 sur `surface` |
| `premium` | `#FFC107` (jaune accent) | Badges Pro/Premium, bouton « Passer en Pro » | Texte bleu nuit dessus : 10,1:1. **Jamais en texte sur fond blanc (1,6:1)** |
| `accent` | `#00D4FF` (cyan) | Dégradés, détails décoratifs | **Jamais en texte** (1,8:1 sur blanc) |
| `border` | `#D6E2F5` | Bordures décoratives des cartes | Décoratif |
| `input-border` | `#7A8CA8` | Bordures des champs et cases | 3,4:1 sur blanc |
| `success` | `#1B7F3B` | Confirmations | 5,1:1 sur blanc |
| `destructive` | `#C62828` | Erreurs, suppression | 5,6:1 sur blanc |
| `ring` | `#0F6FE6` | Anneau de focus (2 px, décalé de 2 px) | 4,7:1 sur blanc |

Avertissements : fond `premium` à 15 % d'opacité, texte `foreground`, icône.
Dégradé de marque : `linear-gradient(135deg, #0F6FE6, #00D4FF)`.

Les variables de shadcn/ui (`--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`,
`--border`, `--input`, `--ring`, `--radius`) sont reliées à ces tokens.

---

## 3. Typographie

**Poppins**, chargée par `next/font/google` (fichiers servis par le site, aucune requête vers
Google à l'exécution). Graisses : 400 Regular (texte), 500 Medium (labels, texte secondaire),
600 SemiBold (sous-titres, boutons), 700 Bold (titres).

| Style | Mobile | Ordinateur | Graisse | Interligne |
|-------|--------|------------|---------|------------|
| Titre hero (h1) | 32 px | 48 px | 700 | 1,15 |
| Titre de section (h2) | 26 px | 36 px | 700 | 1,2 |
| Sous-titre (h3) | 20 px | 24 px | 600 | 1,3 |
| Texte d'introduction | 18 px | 20 px | 400 | 1,6 |
| Texte courant | 16 px | 16 px | 400 | 1,6 |
| Label, bouton | 16 px | 16 px | 600 (bouton) / 500 (label) | 1,4 |
| Petit texte (mentions, aides) | 14 px | 14 px | 400 | 1,5 |

Aucun texte inférieur à 14 px ; 16 px minimum pour les champs de saisie (évite le zoom
automatique sur iOS).

**CV (aperçu et PDF)** : Poppins également, texte 10,5 pt, titres de section 12 pt, nom 20 pt.

---

## 4. Espacements, rayons, ombres, grille

| Élément | Valeur |
|---------|--------|
| Unité d'espacement | 4 px (échelle Tailwind) ; sections : 64 px mobile, 96 px ordinateur |
| Conteneur | 1 200 px maximum (référence d'écran 1 440 px) ; marges latérales 16 px mobile, 24 px tablette, 32 px ordinateur |
| Largeur du contenu | **Tous les écrans en pleine largeur du conteneur** : aucune colonne étroite (`mx-auto max-w-…`) entourée de vide, formulaires courts compris. Sur ordinateur, une seconde colonne utile occupe l'espace : outils du CV (formulaire / résultat, état vide explicite), assistant (question / exemple et récapitulatif des réponses), compte et crédits (cartes côte à côte), pages légales (sommaire fixe / texte), écrans courts — connexion, bienvenue, génération, pages d'erreur — (contenu / colonne de la marque `BrandAside` : illustration et atouts). Sur mobile, tout s'empile. Exceptions : fenêtres de dialogue et feuille du CV (ADR-033) |
| Points de rupture | 640, 768, 1024, 1280 px (Tailwind) ; conception mobile d'abord |
| Rayons | Boutons d'action : pilule (`rounded-full`) ; champs : 12 px ; cartes : 16 px ; boîtes de dialogue : 20 px |
| Ombres | Carte : `0 8px 24px rgb(15 111 230 / 0.08)` ; survol : `0 12px 32px rgb(15 111 230 / 0.12)` ; carte mise en avant : ombre + bordure `primary` |
| Zones tactiles | 44 × 44 px minimum |

---

## 5. Mouvement

- Durées : 150 ms (survol, focus), 200 ms (apparition), 300 ms maximum (boîtes de dialogue,
  étapes de l'assistant). Courbe `ease-out`.
- Aucune animation en boucle hors chargement.
- `prefers-reduced-motion: reduce` : transitions supprimées, chargement statique.
- Micro-interactions en place (ADR-024) : bouton d'envoi `SubmitButton` (indicateur de
  chargement, texte conservé, désactivé pendant l'action et tant que la page n'est pas
  interactive) ; messages de formulaire et étapes qui apparaissent en fondu (200 ms).
  Animations en CSS (tw-animate-css), sans bibliothèque d'animation.
- **Transitions entre les pages** (ADR-035), par les transitions de vue natives
  (`<ViewTransition>` de React) :
  - l'en-tête reste immobile ; le contenu part en fondu (100 ms) et le suivant arrive en fondu
    (180 ms), sans glisser ni se déformer ;
  - seules les navigations par lien (type `nav`, posé par le `Link` de `@/i18n/navigation`)
    s'animent : jamais les actions faites dans une page (formulaires, outils IA) ;
  - le contenu chargé en flux apparaît en fondu (`Appear` dans chaque `Suspense`) ;
  - le titre d'une page est hors du chargement : il s'affiche tout de suite ;
  - les onglets d'un CV sont dans la mise en page commune `/cv/[id]` : ils ne disparaissent
    jamais d'un onglet à l'autre ;
  - les squelettes ont la forme de la page attendue et n'apparaissent qu'après 700 ms
    (`skeleton-appear`) : un chargement normal n'affiche aucune barre grise.

---

## 6. Icônes et illustrations

- **Icônes d'interface** : Lucide (trait 2 px), 20 px dans les boutons, 24 px dans les listes,
  toujours accompagnées d'un texte ou d'un `aria-label`.
- **Illustrations 3D du kit** (personnages, chronomètre 30s, CV, trophée, cible…) : réservées
  aux sections marketing et aux états vides. Fichiers séparés à fournir (tâche manuelle 8).
- **Logo** (ADR-023) : en français, le logo du kit web à l'identique, détouré
  (`src/assets/brand/logo-fr.png`) ; dans les autres langues, son icône
  (`src/assets/brand/logo-icone.png`) suivie du nom traduit sur deux lignes, comme le logo :
  nom en gras bleu nuit, puis connecteur et pastille `primary` en italique blanc (H31). Hauteur
  44 px sur mobile, 56 px à partir de 640 px.

---

## 7. Composants

Base : shadcn/ui, adaptés aux tokens. États obligatoires pour chaque composant interactif :
défaut, survol, focus visible, actif, désactivé, chargement (si asynchrone), erreur (si saisie).

| Composant | Variantes et règles |
|-----------|---------------------|
| `Button` | `primary` (bleu, texte blanc) · `premium` (jaune, texte bleu nuit, icône couronne) · `outline` (bordure `primary`, texte `primary-strong`) · `ghost` · `destructive`. Tailles `md` (44 px) et `lg` (52 px, appels à l'action). En chargement : indicateur + texte conservé, bouton désactivé |
| `CreditCostButton` | Bouton d'action IA : libellé + coût (« Adapter — 2 crédits ») ; cadenas et texte explicatif si verrouillé |
| `Card` | Fond blanc, rayon 16 px, ombre de carte ; variante `highlighted` (offre recommandée) |
| `PlanCard` | Nom, prix TTC, périodicité, économie annuelle, crédits/mois, liste ✓/✗ de la matrice, bouton ; badge « Recommandé » pour Pro |
| `Badge` | `free` (surface) · `pro` et `premium` (jaune, texte bleu nuit) · `recommended` · `credits` (bleu clair, icône éclair) |
| `Input`, `Textarea`, `Label` | Bordure `input-border`, focus `ring` ; message d'erreur sous le champ en `destructive` avec icône ; compteur de caractères pour les textes longs |
| `Progress` | Barre de l'assistant (1/5 à 5/5) avec texte « Question 2 sur 5 » |
| `Stepper` de chargement | Étapes de génération (analyse, rédaction, mise en forme) avec état en cours / fait |
| `Dialog`, `AlertDialog` | Solde insuffisant, remplacement de CV, suppression ; fermeture au clavier (Échap), focus piégé et rendu |
| `Sheet` | Menu de navigation mobile |
| `Tabs` | Outils d'un CV (Inc-7 à Inc-9) |
| `ToggleGroup` | Bascule Mensuel / Annuel |
| `Skeleton` | Chargement des pages privées |
| `Sonner` (toasts) | Confirmations brèves (« Copié », « Enregistré ») ; jamais seul canal pour une erreur bloquante |
| `DropdownMenu` | Menu du compte |
| `EmptyState` | Illustration + titre + texte + action |
| `LanguageSwitcher` | Menu listant chaque langue dans sa propre langue (« Français », « English », « Italiano », « Español », « Deutsch »), sans drapeau ; conserve la page en cours |
| `LanguageSelect` | Champ « Langue du CV » avant chaque génération (H30) |

**Textes plus longs** : aucune largeur fixe sur un élément contenant du texte ; chaque composant
est vérifié avec des textes 35 % plus longs (allemand) ; les boutons passent à la ligne plutôt
que de tronquer.

---

## 8. Ton et micro-textes

- **Tutoiement** dans l'interface, comme l'INTAKE (« Crée ton CV », « Passe en Pro »), et ton
  familier équivalent dans chaque langue : *you* (anglais), *tu* (italien), *tú* (espagnol),
  *du* (allemand). **Ton formel** dans les pages légales de toutes les langues.
- Le français est la langue de rédaction ; les autres langues sont des adaptations naturelles,
  pas des traductions mot à mot. Le vocabulaire fixe ci-dessous a une traduction unique par
  langue, tenue dans les fichiers de messages.
- Phrases courtes, verbes d'action, sans jargon technique ni anglicisme inutile.
- Vocabulaire fixe : « crédit(s) IA », « formule » (Essential, Pro, Premium), « CV Pro »,
  « essai gratuit », « crédits inclus », « crédits achetés ».
- Erreurs : ce qui s'est passé + ce que l'utilisateur peut faire (`docs/system-design.md` §2).
- Exemples : « Créer mon CV gratuitement » · « Générer mon CV » · « Copier le texte » ·
  « Télécharger le PDF » · « Passer en Pro » · « Gérer mon abonnement ».

---

## 9. Accessibilité (WCAG 2.2 niveau AA)

- HTML sémantique : un seul `h1` par page, titres hiérarchisés, `main`, `nav`, `footer`.
- Chaque champ a un `label` visible ; erreurs reliées par `aria-describedby` ; résumé des erreurs
  annoncé (`role="alert"`).
- Navigation complète au clavier ; ordre de tabulation logique ; lien « Aller au contenu ».
- Focus toujours visible (anneau 2 px).
- L'information n'est jamais portée par la couleur seule (icône ou texte en plus).
- États de chargement annoncés (`aria-live="polite"`) ; génération : étape en cours annoncée.
- Audit automatique (axe) dans les tests Playwright du parcours principal.

---

## 10. Formats

Cinq langues (ADR-018) : `fr-FR`, `en`, `it-IT`, `es-ES`, `de-DE`. Prix toujours en euros,
formatés selon la langue (« 6,99 € » en français, « €6.99 » en anglais) ; dates longues
(« 23 novembre 2026 », « 23 November 2026 »…). Formatage via `Intl.NumberFormat` et
`Intl.DateTimeFormat`, dans un module unique ; aucun format écrit à la main.

Poppins couvre les caractères des 5 langues (accents, ß, ñ).
