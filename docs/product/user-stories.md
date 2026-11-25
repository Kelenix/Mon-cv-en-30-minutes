# User stories — Mon CV en 30 Secondes (version Web)

> Phase 1 — Définition produit (rôle : Product Owner). Date : 23/11/2026.
> Entrées : `INTAKE.md`, `docs/PLAN_DE_REALISATION.md` (C1–C9, H1–H17, Q1–Q6), `DECISION_LOG.md`.
> Critères d'acceptation au format **Étant donné / Quand / Alors** (Given / When / Then).
> Chaque story trace vers une section de l'INTAKE (§). Taille : S / M / L.

---

## 1. Personas

| Persona | Situation | Objectif principal | Offre la plus probable |
|---------|-----------|--------------------|------------------------|
| Étudiant ou jeune diplômé | Premier CV, peu d'expérience, petit budget | Un CV correct, vite et gratuitement | Gratuit, packs de crédits |
| Demandeur d'emploi actif | Postule souvent | Adapter son CV à chaque offre, rédiger des lettres | Pro |
| Personne en reconversion ou en poste | Veut repositionner son profil | Accroche, version LinkedIn, préparation d'entretien | Essential, Pro ou crédits |
| Utilisateur intensif | Utilise tous les outils chaque mois | Volume de crédits et rapidité | Premium |

Rôles employés dans les stories : **visiteur** (non connecté), **utilisateur** (connecté, quel que
soit son statut), **utilisateur sans abonnement**, **abonné** (Essential, Pro ou Premium, essai
compris).

---

## 2. Règles produit précisées en phase 1

Elles complètent H1–H17 du plan et sont consignées dans `DECISION_LOG.md` (ADR-008).

| # | Règle |
|---|-------|
| H18 | En-tête du CV : nom (saisi à la première connexion, pré-rempli par Google), e-mail du compte, téléphone et ville facultatifs. Modifiable. Pas de photo (non demandée). Ce n'est pas une sixième question. |
| H19 | Les 5 réponses sont en texte libre guidé par des exemples. Seule la question 1 (métier) est obligatoire. 2 000 caractères maximum par réponse. |
| H20 | Les contenus générés (variantes d'accroche, lettres, versions LinkedIn, simulations) sont conservés avec le CV concerné et consultables depuis ce CV. |
| H21 | Lettre et version LinkedIn : modification et copie, sans export de fichier (non demandé). |
| H22 | Remplacement de CV (hors Pro et Premium) : l'utilisateur choisit le CV remplacé. Un déblocage CV Pro est perdu avec le CV remplacé, après avertissement. Un ancien abonné Pro garde tous ses CV existants. |
| H23 | Suppression du compte : résiliation immédiate de l'abonnement sans remboursement, crédits perdus, après avertissement explicite. |
| H24 | Paiement d'abonnement échoué : droits maintenus pendant les relances automatiques de Stripe, retirés si l'abonnement est finalement annulé. |
| H25 | Montée de formule : le solde de crédits inclus passe immédiatement au quota de la nouvelle formule. |
| H26 | Vidéo récompensée : proposée à tout utilisateur sans abonnement, y compris après l'achat du retrait des publicités, car elle n'est jamais imposée. |
| H27 | Anti-abus : au plus 3 générations gratuites par adresse IP et par jour. |
| H28 | Comptes inactifs : suppression automatique après 3 ans sans activité, avec un e-mail d'avertissement 30 jours avant. Un compte avec un abonnement actif n'est jamais inactif. Choix de l'utilisateur (ADR-017). |
| H29 | Langues : français, anglais, italien, espagnol et allemand, toutes disponibles dès le lancement (remplace H1). Langue détectée depuis le navigateur à la première visite, puis choix mémorisé. Choix de l'utilisateur (ADR-018). |
| H30 | Langue des contenus IA : sélecteur « Langue du CV », réglé par défaut sur la langue de l'interface ; lettre, LinkedIn, entretien et adaptation reprennent la langue du CV, modifiable à chaque génération. |
| H31 | Nom de marque traduit par langue (validé par l'utilisateur le 25/11/2026, tâche manuelle 12, ADR-048) : FR « Mon CV en 30 Secondes », EN « My CV in 30 Seconds », IT « Il mio CV in 30 secondi », ES « Mi CV en 30 Segundos », DE « Mein Lebenslauf in 30 Sekunden ». Le filigrane du PDF est rédigé dans la langue du CV avec le nom de cette langue. |
| H32 | Prix identiques en euros dans toutes les langues, formatés selon la langue (« 6,99 € », « €6.99 »). |
| H33 | Ton familier dans toutes les langues de l'interface (tu, you, tu, tú, du) ; ton formel dans les pages légales. |
| H34 | **Compatibilité ATS** (rappel de l'utilisateur, ADR-025 ; depuis l'Inc-15, garantie par les modèles marqués « ATS », les autres modèles le signalent, ADR-050) : tout CV généré et exporté doit pouvoir être lu par les logiciels de recrutement qui filtrent les candidatures. Mise en page sur une colonne ; rubriques aux intitulés standard (Expérience professionnelle, Formation, Compétences, Langues), traduits dans la langue du CV ; texte réel et sélectionnable (jamais d'image ni de texte dans des formes) ; pas de tableau ni de zone de texte pour le contenu ; coordonnées dans le corps du document, pas seulement dans l'en-tête ou le pied de page ; polices standard ; dates dans un format homogène ; le filigrane (US-16) reste une ligne de texte séparée du contenu. |

---

## 3. Matrice des droits

Source unique du moteur de droits (Inc-3). Coûts du §11.1. « Achetés » = crédits de packs ou de
vidéos récompensées. « Inclus » = crédits de l'abonnement, consommés en premier quand ils sont
acceptés.

| Fonctionnalité | Coût | Sans abonnement | Essential | Pro (et essai) | Premium |
|----------------|------|-----------------|-----------|----------------|---------|
| Première génération de CV | 0 | ✅ une fois par compte | ✅ une fois par compte | ✅ une fois par compte | ✅ une fois par compte |
| Générer un CV (ensuite) | 1 | Achetés | Inclus ou achetés | Inclus ou achetés | Inclus ou achetés |
| Aperçu, copie, modification manuelle | 0 | ✅ | ✅ | ✅ | ✅ |
| Export PDF | 0 | Avec filigrane (sans filigrane si CV Pro) | Sans filigrane | Sans filigrane | Sans filigrane |
| Export DOCX | 0 | Seulement si CV Pro | ✅ | ✅ | ✅ |
| Améliorer une expérience | 1 | Achetés | Inclus ou achetés | Inclus ou achetés | Inclus ou achetés |
| Améliorer une accroche (variantes) | 1 | Achetés — 3 variantes | Inclus ou achetés — 3 | Inclus ou achetés — 5 | Inclus ou achetés — 5 |
| Version LinkedIn | 1 | Achetés | Inclus ou achetés | Inclus ou achetés | Inclus ou achetés |
| Adapter à une offre + mots-clés manquants | 2 | Achetés | **Achetés uniquement** | Inclus ou achetés | Inclus ou achetés |
| Lettre de motivation | 2 | Achetés | **Achetés uniquement** | Inclus ou achetés | Inclus ou achetés |
| Simulation d'entretien | 2 | Achetés | **Achetés uniquement** | Inclus ou achetés | Inclus ou achetés |
| CV conservés | — | 1 | 1 | Illimité | Illimité |
| Publicités | — | Oui, sauf retrait acheté | Aucune | Aucune | Aucune |
| Priorité des générations IA | — | Standard | Standard | Prioritaire | Maximale |

---

## 4. User stories

### Épopée E1 — Accueil et offres (Inc-1)

#### US-01 — Découvrir la proposition de valeur
**En tant que** visiteur, **je veux** comprendre en quelques secondes ce que fait le site **afin
de** décider de créer mon CV.
§4.1, §4.4, §14 · Must · Lot MVP · Valeur haute · S

1. **Étant donné** un visiteur sur l'accueil, **alors** la première section affiche le logo, le
   titre « Crée ton CV professionnel en quelques secondes grâce à l'IA. » (traduit dans chaque
   langue), un court texte
   explicatif, une illustration de la marque et le bouton « Créer mon CV gratuitement ».
2. **Étant donné** un écran de 1440 px ou de 375 px de large, **quand** la page se charge,
   **alors** le bouton principal est visible sans défilement.
3. **Quand** le visiteur clique sur « Créer mon CV gratuitement » (en haut ou en bas de page),
   **alors** il arrive sur la première des 5 questions, sans créer de compte.

#### US-02 — Découvrir les fonctionnalités
**En tant que** visiteur, **je veux** voir les outils proposés **afin de** savoir ce que je
pourrai faire après mon CV.
§4.2 · Must · Lot MVP · Valeur moyenne · S

1. **Alors** l'accueil présente les 6 fonctionnalités du §4.2, chacune avec une icône du kit, un
   titre et une phrase.
2. **Alors** les fonctionnalités payantes indiquent qu'elles utilisent des crédits ou un
   abonnement ; aucune n'est présentée comme gratuite.

#### US-03 — Comparer les offres
**En tant que** visiteur, **je veux** comparer les offres avant de payer **afin de** choisir en
connaissance de cause.
§4.3, §12, §15, §18 · Must · Lot MVP · Valeur haute · M

1. **Alors** l'accueil présente Gratuit, Crédits IA, Essential, Pro, Premium et CV Pro à l'unité,
   avec un lien vers la page Tarifs.
2. **Alors** la page Tarifs affiche trois cartes Essential, Pro et Premium ; Pro porte le badge
   « Recommandé » et les trois restent sélectionnables de la même façon.
3. **Quand** le visiteur bascule entre Mensuel et Annuel, **alors** chaque carte affiche le prix
   TTC, les crédits par mois et l'économie annuelle calculée (Essential −37 %, Pro −52 %,
   Premium −42 %).
4. **Alors** chaque carte liste ses fonctionnalités exactement comme la matrice du §3, sans le mot
   « illimité » appliqué aux crédits, CV ou lettres.
5. **Alors** les packs (5 crédits 2,99 €, 15 crédits 6,99 €, 40 crédits 14,99 €), le CV Pro
   (4,99 €), le retrait des publicités (2,99 €, si l'option est activée) et les conditions (essai
   de 3 jours, renouvellement automatique, annulation à tout moment) sont visibles avant toute
   souscription.

### Épopée E2 — Compte (Inc-2)

#### US-04 — Créer un compte ou me connecter
**En tant que** visiteur, **je veux** créer un compte en un clic **afin de** sauvegarder mon CV.
§3, Q3 · Must · Lot MVP · Valeur haute · M

1. **Alors** l'utilisateur peut s'inscrire ou se connecter avec Google ou avec son e-mail (lien ou
   code à usage unique), sans mot de passe.
2. **Quand** il se connecte pour la première fois, **alors** il saisit son prénom et son nom
   (pré-remplis avec Google) (H18).
3. **Étant donné** un visiteur qui a répondu aux 5 questions, **quand** il crée son compte,
   **alors** il revient à l'étape de génération avec ses réponses intactes.
4. **Étant donné** une session expirée, **quand** l'utilisateur ouvre une page privée, **alors**
   il est renvoyé vers la connexion puis vers la page demandée.

#### US-05 — Gérer mon compte
**En tant qu'**utilisateur, **je veux** consulter et modifier mes informations **afin de** garder
mon compte à jour.
§3 (espace compte) · Must · Lot MVP · Valeur moyenne · S · Dépend de US-22 pour le lien abonnement

1. **Alors** l'espace compte affiche le nom, l'e-mail, la formule, le solde de crédits et les
   achats uniques (retrait des publicités, CV Pro).
2. **Alors** l'utilisateur peut modifier son nom et ses coordonnées par défaut (téléphone, ville),
   reprises dans l'en-tête des nouveaux CV.
3. **Alors** il peut se déconnecter, et le lien « Gérer mon abonnement » ouvre le portail Stripe.

#### US-06 — Supprimer mon compte
**En tant qu'**utilisateur, **je veux** supprimer mon compte et mes données **afin d'**exercer
mon droit à l'effacement.
RGPD (H16, H23) · Must · Lot MVP · Valeur haute · M · Dépend de Inc-6 pour la résiliation

1. **Quand** l'utilisateur demande la suppression, **alors** un écran récapitule ce qui sera perdu
   (CV, contenus générés, crédits, abonnement) et exige la saisie du mot « SUPPRIMER ».
2. **Quand** il confirme, **alors** l'abonnement Stripe actif est résilié immédiatement, le compte
   et toutes ses données sont supprimés en moins d'une minute et l'utilisateur est déconnecté.
3. **Alors** aucune donnée personnelle de ce compte ne subsiste en base (vérifié par test) ; seules
   les factures restent chez Stripe, au titre de l'obligation légale de conservation.

#### US-40 — Suppression automatique des comptes inactifs
**En tant qu'**exploitant, **je veux** supprimer les comptes inactifs depuis 3 ans **afin de**
respecter la durée de conservation limitée du RGPD.
RGPD (H16, H28) · Must · Lot V1 (Inc-13) · Valeur moyenne · M

1. **Étant donné** un compte sans abonnement actif dont la dernière activité date de 3 ans moins
   30 jours, **quand** la tâche quotidienne s'exécute, **alors** un e-mail l'avertit de la
   suppression dans 30 jours et indique qu'une connexion suffit à l'annuler.
2. **Étant donné** un compte averti depuis 30 jours et toujours inactif, **alors** il est
   supprimé avec toutes ses données, comme en US-06.
3. **Quand** l'utilisateur se connecte après l'avertissement, **alors** son activité est mise à
   jour et la suppression n'a pas lieu.
4. **Étant donné** un compte avec un abonnement actif, **alors** il n'est jamais averti ni
   supprimé.
5. **Quand** la tâche est relancée le même jour, **alors** aucun e-mail n'est envoyé deux fois
   (test).

### Épopée E3 — Crédits et droits (Inc-3)

#### US-07 — Voir ma formule et mes crédits
**En tant qu'**utilisateur, **je veux** connaître ma formule et mes crédits **afin de** savoir ce
que je peux encore faire.
§12 (règles), §16.3, §17 · Must · Lot MVP · Valeur haute · S

1. **Alors** l'en-tête de l'espace connecté affiche le solde total ; un clic détaille crédits
   inclus et crédits achetés.
2. **Alors** l'espace crédits affiche la formule, la date de la prochaine remise des crédits
   inclus et la date de renouvellement de l'abonnement.
3. **Étant donné** un utilisateur sans abonnement, **alors** il voit « Aucun abonnement » et son
   solde de crédits achetés.

#### US-08 — Payer une opération IA en crédits
**En tant qu'**utilisateur, **je veux** connaître et payer le coût de chaque opération IA **afin
de** ne jamais être débité par surprise.
§11.1, §12 (règles), §17 · Must · Lot MVP · Valeur haute · L

1. **Alors** chaque bouton d'opération IA indique son coût (ex. « Adapter — 2 crédits ») et le
   solde restant après l'opération.
2. **Étant donné** un solde suffisant, **quand** l'opération est lancée, **alors** le coût du
   §11.1 est débité une seule fois, crédits inclus d'abord puis crédits achetés, selon la matrice.
3. **Étant donné** un solde insuffisant, **quand** l'utilisateur lance l'opération, **alors**
   aucun appel IA n'est fait et une fenêtre propose packs et formules.
4. **Quand** l'opération échoue (erreur IA, délai dépassé), **alors** les crédits sont rendus
   automatiquement et un message l'indique.
5. **Quand** deux opérations sont lancées en même temps, **alors** le solde ne devient jamais
   négatif (test de concurrence).

#### US-09 — Accéder aux fonctionnalités selon mes droits
**En tant qu'**utilisateur, **je veux** savoir ce que ma formule permet **afin de** débloquer ce
dont j'ai besoin.
§6 à §12, Q2 · Must · Lot MVP · Valeur haute · M

1. **Alors** chaque action IA est autorisée côté serveur selon la matrice du §3 ; une requête
   forgée vers une fonction non autorisée est refusée (test).
2. **Étant donné** un abonné Essential sans crédits achetés, **quand** il ouvre « Adapter à une
   offre », **alors** il voit que cette fonction se paie en crédits achetés et peut en acheter.
3. **Étant donné** un utilisateur sans abonnement avec des crédits achetés, **quand** il lance une
   lettre de motivation, **alors** 2 crédits achetés sont débités.
4. **Alors** une fonction non accessible reste visible, avec un cadenas et la façon de la
   débloquer.

### Épopée E4 — Création du CV (Inc-4)

#### US-10 — Répondre aux 5 questions
**En tant que** visiteur, **je veux** répondre à 5 questions simples **afin de** donner à l'IA
de quoi rédiger mon CV.
§5.1, §13, §14 · Must · Lot MVP · Valeur haute · M

1. **Alors** les 5 questions du §5.1 s'affichent dans l'ordre, une par écran, avec une barre de
   progression (1/5 à 5/5), un exemple de réponse et les boutons Précédent / Suivant.
2. **Alors** seule la question 1 (métier) est obligatoire ; si les réponses 2 à 5 totalisent moins
   de 80 caractères, un message invite à les compléter sans bloquer.
3. **Alors** chaque réponse est limitée à 2 000 caractères, avec un compteur.
4. **Quand** l'utilisateur recharge la page, revient en arrière ou crée son compte, **alors** ses
   réponses sont conservées.
5. **Alors** aucune publicité ni offre payante ne s'affiche pendant la saisie.

#### US-11 — Générer mon CV avec l'IA
**En tant qu'**utilisateur, **je veux** que l'IA rédige mon CV à partir de mes réponses **afin
d'**obtenir un CV structuré en quelques secondes.
§5.2, §14, §17 · Must · Lot MVP · Valeur haute · L · Dépend de US-04, US-08, US-10

1. **Étant donné** un compte qui n'a jamais utilisé sa génération gratuite, **quand** il lance la
   génération, **alors** aucun crédit n'est débité et la gratuité n'est consommée que si la
   génération réussit.
2. **Étant donné** une génération gratuite déjà utilisée, **alors** une nouvelle génération coûte
   1 crédit (US-08).
3. **Quand** la génération démarre, **alors** un état de chargement apparaît en moins de 300 ms
   et montre les étapes (analyse, rédaction, mise en forme).
4. **Alors** la génération se termine en moins de 30 s dans 95 % des cas, mesuré sur un jeu de
   20 profils de référence.
5. **Alors** le CV ne contient aucune entreprise, date, diplôme ou certification absent des
   réponses (vérifié sur le jeu de référence) et il est rédigé dans la langue des réponses.
5 bis. **Alors** le CV respecte la compatibilité ATS (H34) : rubriques aux intitulés standard,
   une seule colonne, contenu en texte, formulations sobres et mots-clés du métier visé repris
   tels quels.
6. **Quand** la génération échoue, **alors** un message clair propose de réessayer, sans perte des
   réponses ni des crédits.
7. **Alors** une même adresse IP ne peut pas obtenir plus de 3 générations gratuites par jour
   (H27).

#### US-12 — Consulter l'aperçu complet
**En tant qu'**utilisateur, **je veux** voir mon CV tel qu'il sera exporté **afin de** le
vérifier.
§5.2, §14, §16.3 · Must · Lot MVP · Valeur haute · M

1. **Alors** l'aperçu montre le CV complet dans sa mise en page finale : en-tête, accroche,
   expériences, compétences, formation.
2. **Alors** l'en-tête est pré-rempli avec le nom, l'e-mail et les coordonnées par défaut du
   compte, sans photo (H18).
3. **Étant donné** un écran de 375 px, **alors** l'aperçu est lisible sans défilement horizontal.
4. **Alors** aucune publicité ne s'affiche avant ni pendant l'aperçu.

#### US-13 — Copier le texte de mon CV
**En tant qu'**utilisateur, **je veux** copier le texte de mon CV **afin de** le coller dans un
formulaire de candidature.
§5.2, §14 · Must · Lot MVP · Valeur moyenne · S

1. **Quand** l'utilisateur clique sur « Copier », **alors** tout le texte du CV est placé dans le
   presse-papiers en texte brut organisé par sections, et le bouton affiche « Copié ».
2. **Alors** la copie fonctionne aussi sur smartphone.

#### US-14 — Modifier mon CV manuellement
**En tant qu'**utilisateur, **je veux** corriger mon CV moi-même **afin qu'**il soit exact.
§5.2, §14, §16.3 · Must · Lot MVP · Valeur haute · M

1. **Alors** chaque section est modifiable sur place ; on peut ajouter, supprimer et réordonner
   expériences et formations.
2. **Alors** les modifications sont enregistrées automatiquement (indicateur « Enregistré ») et ne
   coûtent aucun crédit.
3. **Alors** chaque champ est validé (longueur maximale) avec un message clair.

#### US-15 — Découvrir les offres après ma première génération
**En tant qu'**utilisateur, **je veux** découvrir les fonctions avancées une fois mon CV obtenu
**afin de** l'améliorer si je le souhaite.
§14 (première proposition payante après la première génération réussie) · Must · Lot MVP · Valeur haute · S

1. **Alors** aucune proposition payante n'apparaît dans le parcours de création avant la première
   génération réussie.
2. **Après** la première génération réussie, **alors** l'aperçu affiche un encart non bloquant,
   refermable, présentant les fonctions avancées et un lien vers les offres.
3. **Étant donné** un abonné, **alors** l'encart ne présente que les formules supérieures à la
   sienne, et rien pour un abonné Premium.

### Épopée E5 — Exports (Inc-5)

#### US-16 — Exporter un PDF gratuit avec filigrane
**En tant qu'**utilisateur sans abonnement, **je veux** télécharger mon CV en PDF gratuitement
**afin de** postuler tout de suite.
§5.3, §14 · Must · Lot MVP · Valeur haute · M

1. **Alors** tout utilisateur peut télécharger son CV en PDF sans dépenser de crédit.
2. **Étant donné** ni abonnement ni CV Pro pour ce CV, **alors** chaque page porte le filigrane
   discret « Créé avec Mon CV en 30 Secondes » en pied de page, ajouté côté serveur, rédigé dans
   la langue du CV avec le nom de marque de cette langue (H31).
3. **Alors** le PDF reproduit l'aperçu (mêmes sections, même ordre) et s'appelle
   « CV-Prénom-Nom.pdf ».
4. **Alors** le texte du PDF est sélectionnable, donc lisible par les logiciels de recrutement.

#### US-17 — Exporter sans filigrane en PDF et DOCX
**En tant qu'**abonné ou acheteur d'un CV Pro, **je veux** un PDF sans filigrane et un DOCX
**afin d'**envoyer un CV irréprochable.
§5.3, §12 · Must · Lot MVP · Valeur haute · M

1. **Étant donné** un abonné (essai compris) ou un CV débloqué en CV Pro, **quand** il exporte,
   **alors** le PDF n'a pas de filigrane et l'export DOCX est proposé.
2. **Alors** le DOCX s'ouvre dans Word et LibreOffice avec ses sections, titres et listes.
2 bis. **Alors** le PDF et le DOCX respectent la compatibilité ATS (H34) : le texte extrait
   automatiquement des deux fichiers restitue chaque rubrique dans l'ordre de lecture, sans
   perte ni mélange (vérifié par test d'extraction de texte).
3. **Étant donné** un utilisateur sans droit, **alors** il voit comment débloquer le DOCX, et un
   appel direct à l'export DOCX est refusé côté serveur.

### Épopée E6 — Paiements et abonnements (Inc-6)

#### US-18 — Acheter un pack de crédits
**En tant qu'**utilisateur, **je veux** acheter des crédits sans m'abonner **afin d'**utiliser
l'IA ponctuellement.
§11.2, §18 · Must · Lot MVP · Valeur haute · M

1. **Alors** l'utilisateur choisit un pack (5, 15 ou 40 crédits) et paie sur Stripe Checkout,
   après avoir coché la renonciation au droit de rétractation pour une fourniture immédiate.
2. **Quand** Stripe confirme le paiement, **alors** les crédits sont ajoutés au solde « acheté »
   une seule fois, même si la confirmation arrive plusieurs fois.
3. **Quand** l'utilisateur revient sur le site, **alors** le nouveau solde s'affiche en moins de
   10 s.
4. **Quand** le paiement est abandonné ou refusé, **alors** aucun crédit n'est ajouté et un
   message clair s'affiche.

#### US-19 — Débloquer un CV Pro à l'unité
**En tant qu'**utilisateur sans abonnement, **je veux** débloquer un seul CV **afin d'**avoir un
export professionnel sans m'abonner.
§12 (configuration commerciale), §14, §18 · Must · Lot MVP · Valeur moyenne · S

1. **Alors** depuis l'aperçu d'un CV, l'utilisateur peut acheter « CV Pro » (4,99 €) pour ce CV.
2. **Après** paiement, **alors** ce CV s'exporte définitivement sans filigrane, en PDF et en DOCX.
3. **Quand** ce CV va être remplacé par une nouvelle génération, **alors** un avertissement
   indique que le déblocage sera perdu (H22).

#### US-20 — Souscrire une formule
**En tant qu'**utilisateur, **je veux** souscrire Essential, Pro ou Premium **afin de** disposer
de crédits chaque mois et des avantages de la formule.
§12, §14, §18 · Must · Lot MVP · Valeur haute · L

1. **Alors** l'utilisateur choisit une formule et une périodicité (mensuelle ou annuelle) et paie
   sur Stripe Checkout.
2. **Quand** Stripe confirme, **alors** la formule est active, les crédits inclus du mois sont
   alloués (20, 60 ou 150) et les publicités disparaissent.
3. **Étant donné** un paiement d'abonnement échoué, **alors** les droits sont maintenus pendant
   les relances ; **si** l'abonnement est annulé faute de paiement, **alors** l'utilisateur
   repasse sans abonnement, garde ses crédits achetés et perd ses crédits inclus (H24).
4. **Étant donné** un utilisateur déjà abonné, **alors** il ne peut pas souscrire un second
   abonnement et il est dirigé vers le changement de formule (US-22).

#### US-21 — Essayer Pro gratuitement pendant 3 jours
**En tant qu'**utilisateur, **je veux** essayer Pro sans payer **afin de** juger de son intérêt.
§15, §18, Q5 · Must · Lot MVP · Valeur haute · M

1. **Étant donné** un compte qui n'a jamais eu d'essai, **alors** il peut démarrer un essai Pro
   (mensuel ou annuel) ; le moyen de paiement est demandé et rien n'est débité pendant 3 jours.
2. **Pendant** l'essai, **alors** l'utilisateur a les droits Pro avec 10 crédits d'essai.
3. **Sans** résiliation avant la fin de l'essai, **alors** le premier paiement est débité et
   60 crédits inclus remplacent les crédits d'essai restants.
4. **Quand** l'utilisateur résilie pendant l'essai, **alors** l'abonnement s'arrête à la fin des
   3 jours sans aucun débit.
5. **Avant** validation, **alors** la page affiche la durée de l'essai, la date et le montant du
   premier débit, le renouvellement automatique et l'annulation possible à tout moment.
6. **Alors** un second essai sur le même compte est refusé.

#### US-22 — Changer de formule ou résilier
**En tant qu'**abonné, **je veux** gérer mon abonnement en ligne **afin de** l'adapter à mes
besoins ou l'arrêter.
§12 (règles), §18 · Must · Lot MVP · Valeur haute · M

1. **Alors** « Gérer mon abonnement » ouvre le portail client Stripe : changement de formule et de
   périodicité, moyen de paiement, factures, résiliation.
2. **Quand** l'abonné monte de formule, **alors** le changement est immédiat, facturé au prorata,
   et le solde inclus passe au quota de la nouvelle formule (H25).
3. **Quand** il descend de formule ou résilie, **alors** le changement prend effet à la fin de la
   période payée, dont la date s'affiche dans l'espace crédits.

#### US-23 — Recevoir mes crédits inclus chaque mois
**En tant qu'**abonné, **je veux** retrouver mon quota de crédits chaque mois **afin de**
profiter de ma formule.
§12 (règles) · Must · Lot MVP · Valeur haute · M

1. **Alors** chaque mois, à la date anniversaire de la souscription, le solde inclus est remis au
   quota de la formule (20, 60 ou 150), sans report des crédits non utilisés.
2. **Alors** cette remise a aussi lieu chaque mois pour les abonnements annuels.
3. **Alors** les crédits achetés ne sont jamais modifiés par cette remise.
4. **Quand** la tâche planifiée est relancée, **alors** la remise n'a lieu qu'une fois par mois
   (test).

### Épopée E7 — Amélioration par IA (Inc-7)

#### US-25 — Améliorer une expérience
**En tant qu'**utilisateur, **je veux** que l'IA reformule une expérience **afin de** mieux
valoriser ce que j'ai fait.
§6 · Must · Lot V1 · Valeur haute · M

1. **Alors** chaque expérience de l'aperçu propose « Améliorer avec l'IA — 1 crédit ».
2. **Quand** l'utilisateur l'utilise, **alors** il voit l'avant et l'après, puis choisit
   « Remplacer » ou « Garder l'original » ; le crédit est consommé dans les deux cas.
3. **Alors** la version améliorée n'ajoute aucun chiffre, résultat ou fait absent du texte
   d'origine (vérifié sur le jeu de référence).

#### US-26 — Améliorer mon accroche
**En tant qu'**utilisateur, **je veux** plusieurs propositions d'accroche **afin de** choisir
celle qui me ressemble.
§6, §12 · Must · Lot V1 · Valeur haute · M

1. **Quand** l'utilisateur lance « Améliorer l'accroche — 1 crédit », **alors** il reçoit 3
   variantes (sans abonnement, Essential) ou 5 (Pro, Premium).
2. **Quand** il choisit une variante, **alors** elle remplace l'accroche et reste modifiable.
3. **Alors** les variantes restent consultables avec le CV (H20).

#### US-27 — Adapter mon CV à une offre d'emploi
**En tant que** candidat, **je veux** adapter mon CV à une annonce **afin d'**augmenter mes
chances d'être retenu.
§6 · Must · Lot V1 · Valeur haute · L

1. **Alors** l'utilisateur colle le texte d'une annonce (50 à 10 000 caractères) et lance
   « Adapter — 2 crédits ».
2. **Alors** il reçoit un CV adapté (accroche, ordre et formulation des expériences et
   compétences) et la liste des mots-clés de l'annonce absents de son CV.
3. **Alors** le CV adapté n'ajoute aucune expérience, compétence ou diplôme non présent dans le
   CV : les compétences manquantes figurent seulement dans la liste des mots-clés.
4. **Alors** l'utilisateur applique l'adaptation au CV courant ou, en Pro et Premium, l'enregistre
   comme nouveau CV.
5. **Étant donné** une annonce contenant une consigne cachée (« ignore les instructions… »),
   **alors** cette consigne n'a aucun effet (test d'injection).
6. **Alors** l'accès suit la matrice : Pro, Premium, ou crédits achetés (Q2).

### Épopée E8 — LinkedIn et lettre de motivation (Inc-8)

#### US-28 — Générer ma version LinkedIn
**En tant qu'**utilisateur, **je veux** une version LinkedIn de mon CV **afin de** mettre mon
profil à jour rapidement.
§7 · Must · Lot V1 · Valeur moyenne · M

1. **Quand** l'utilisateur lance « Version LinkedIn — 1 crédit », **alors** il reçoit un titre de
   profil (220 caractères maximum), une section « Infos » (2 600 caractères maximum) et une
   description par expérience.
2. **Alors** chaque bloc est modifiable et dispose d'un bouton « Copier ».
3. **Alors** l'accès suit la matrice : abonnés, ou crédits achetés sans abonnement (Q2).

#### US-29 — Générer une lettre de motivation
**En tant que** candidat, **je veux** une lettre adaptée à mon profil et au poste **afin de**
postuler plus vite.
§8 · Must · Lot V1 · Valeur haute · M

1. **Alors** l'utilisateur indique le poste visé (obligatoire), l'entreprise et l'annonce
   (facultatives), puis lance « Lettre — 2 crédits ».
2. **Alors** la lettre compte 250 à 400 mots, s'appuie uniquement sur le CV et ces informations,
   et comporte formule d'appel et formule de politesse.
3. **Alors** la lettre est modifiable, copiable et conservée avec le CV (H20, H21).
4. **Alors** l'accès suit la matrice : Pro, Premium, ou crédits achetés (Q2).

### Épopée E9 — Simulation d'entretien (Inc-9)

#### US-30 — Simuler un entretien
**En tant que** candidat, **je veux** m'entraîner sur des questions d'entretien **afin d'**être
mieux préparé.
§9 · Must · Lot V1 · Valeur haute · L

1. **Quand** l'utilisateur indique le poste visé et lance « Simulation — 2 crédits », **alors** il
   reçoit 8 questions fréquentes adaptées à son CV et au poste.
2. **Alors** il répond par écrit à tout ou partie des questions (2 000 caractères maximum par
   réponse), puis demande son retour.
3. **Alors** le retour donne, pour chaque question répondue, les points forts, les points à
   améliorer et un exemple de réponse, sans coût supplémentaire.
4. **Alors** la simulation est conservée avec le CV et peut être relue.
5. **Alors** l'accès suit la matrice : Pro, Premium, ou crédits achetés (Q2).

### Épopée E10 — Historique (Inc-10)

#### US-31 — Retrouver mes CV
**En tant qu'**utilisateur, **je veux** retrouver les CV que j'ai créés **afin de** les
réutiliser.
§10, H12, H22 · Must · Lot V1 · Valeur haute · M

1. **Alors** l'historique liste les CV (titre = métier, date de mise à jour) ; un clic ouvre
   l'aperçu.
2. **Étant donné** un abonné Pro ou Premium, **alors** le nombre de CV conservés est illimité.
3. **Étant donné** un utilisateur sans abonnement ou Essential, **quand** il génère un nouveau CV,
   **alors** il choisit le CV à remplacer et confirme.
4. **Étant donné** un ancien abonné Pro, **alors** il garde l'accès à tous ses CV existants après
   une descente de formule.
5. **Alors** l'utilisateur peut supprimer un CV après confirmation.

### Épopée E11 — Publicités (Inc-11)

#### US-24 — Acheter le retrait des publicités
**En tant qu'**utilisateur sans abonnement, **je veux** supprimer définitivement les publicités
**afin de** naviguer sans être dérangé.
§12, §13, §18 · Must · Lot V1 · Valeur moyenne · S

1. **Étant donné** l'option activée par configuration, **alors** l'utilisateur peut acheter le
   retrait définitif des publicités (2,99 €).
2. **Après** paiement, **alors** plus aucune publicité ne s'affiche sur ce compte, y compris
   après la fin d'un éventuel abonnement.
3. **Étant donné** l'option désactivée, **alors** l'offre n'apparaît nulle part.

#### US-32 — Donner ou refuser mon consentement
**En tant que** visiteur, **je veux** choisir si j'accepte les cookies publicitaires **afin de**
maîtriser mes données.
§13, H15, RGPD · Must · Lot V1 · Valeur haute · M

1. **Alors** avant tout traceur publicitaire, un bandeau de consentement certifié par Google
   propose « Accepter » et « Refuser » au même niveau.
2. **Étant donné** un refus ou une absence de choix, **alors** aucun traceur non essentiel n'est
   déposé (vérifié).
3. **Alors** le lien « Gérer les cookies » du pied de page permet de modifier son choix à tout
   moment.

#### US-33 — Voir des bannières et publicités natives non intrusives
**En tant qu'**utilisateur sans abonnement, **je veux** des publicités discrètes **afin de**
profiter du service gratuit sans être gêné.
§13 · Must · Lot V1 · Valeur moyenne · M

1. **Étant donné** un utilisateur sans abonnement ni retrait des pubs, **alors** une bannière
   s'affiche en bas de l'accueil et de l'historique, et une publicité native signalée
   « Publicité » dans l'historique.
2. **Alors** aucune publicité ne s'affiche sur les pages des questions, de génération, d'aperçu,
   d'export et de paiement.
3. **Alors** les emplacements réservent leur hauteur : aucun décalage de mise en page (CLS < 0,1).
4. **Étant donné** un abonné ou un acheteur du retrait, **alors** aucun script publicitaire n'est
   chargé.

#### US-34 — Interstitiel unique après la première génération
**En tant qu'**exploitant, **je veux** afficher un interstitiel une seule fois **afin de**
monétiser sans gêner la création.
§13 · Must · Lot V1 · Valeur faible · S

1. **Étant donné** un utilisateur sans abonnement ni retrait des pubs, **quand** il quitte
   l'aperçu de sa première génération, **alors** un interstitiel refermable s'affiche, une seule
   fois par compte.
2. **Alors** l'interstitiel ne s'affiche jamais pendant la saisie, la génération ou avant
   l'aperçu.

#### US-35 — Gagner un crédit avec une vidéo récompensée
**En tant qu'**utilisateur sans abonnement, **je veux** regarder une annonce pour gagner un
crédit **afin d'**utiliser l'IA sans payer.
§13, §19 · Must · Lot V1 · Valeur moyenne · M

1. **Alors** l'espace crédits, et la fenêtre de solde insuffisant, proposent « Regarde une courte
   annonce pour obtenir 1 crédit IA. » (H26).
2. **Quand** la vidéo est vue jusqu'au bout, **alors** 1 crédit est ajouté au solde « acheté » ;
   une vidéo interrompue ne crédite rien.
3. **Alors** un compte gagne au plus 3 crédits par jour, et chaque crédit exige un jeton à usage
   unique émis par le serveur.
4. **Étant donné** aucune vidéo disponible, **alors** le bouton l'indique au lieu d'échouer.

### Épopée E12 — Exigences transverses

#### US-36 — Utiliser le site sur ordinateur, tablette et smartphone
**En tant qu'**utilisateur, **je veux** un site adapté à mon écran **afin de** créer mon CV
n'importe où.
§16 · Must · Lot MVP (vérifiée à chaque incrément) · Valeur haute · M

1. **Alors** chaque page est validée à 1440, 1024, 768 et 375 px : aucun défilement horizontal,
   texte d'au moins 16 px sur mobile, zones tactiles d'au moins 44 px.
2. **Alors** sur smartphone, les tests de bout en bout couvrent : créer un CV, saisir ses
   informations, consulter l'aperçu, modifier le texte, voir les offres et ses crédits (§16.3).

#### US-37 — Comprendre ce qui se passe
**En tant qu'**utilisateur, **je veux** des retours clairs **afin de** ne jamais être perdu.
§2, §17 · Must · Lot MVP (vérifiée à chaque incrément) · Valeur haute · M

1. **Alors** chaque opération IA ou de paiement affiche un état de chargement, puis un succès ou
   une erreur.
2. **Alors** les messages d'erreur sont en français, sans jargon technique, et proposent une
   action (réessayer, acheter des crédits, se reconnecter).
3. **Alors** les animations durent 300 ms au plus et sont désactivées si le système demande de
   réduire les animations.
4. **Alors** le parcours principal respecte le niveau AA des WCAG 2.2 (contrastes, clavier,
   libellés), sans erreur à l'audit automatique.
5. **Alors** la charte du §2 est respectée : palette officielle, Poppins, fonds blancs et bleu
   clair, jaune réservé aux accents et au Premium.

#### US-38 — Consulter les informations légales
**En tant que** visiteur, **je veux** accéder aux informations légales **afin de** savoir avec
qui je contracte.
§18, H16 · Must · Lot MVP · Valeur haute · S

1. **Alors** le pied de page donne accès aux mentions légales, CGU/CGV, politique de
   confidentialité et gestion des cookies, dans chacune des 5 langues.
2. **Alors** ces pages affichent les informations du vendeur (tâche manuelle 7), et le build de
   production échoue tant qu'une information obligatoire manque.
3. **Alors** les CGV décrivent prix, crédits, essai, renouvellement, résiliation et renonciation
   au droit de rétractation.

#### US-39 — Être trouvé par les moteurs de recherche
**En tant qu'**exploitant, **je veux** que l'accueil et les tarifs soient bien référencés **afin
d'**attirer des visiteurs.
Qualité (rôle SEO) · Should · Lot V1 · Valeur moyenne · S

1. **Alors** l'accueil et les tarifs ont titre, description, balises Open Graph et données
   structurées dans chaque langue, reliées entre elles par des balises `hreflang` ; un sitemap
   multilingue et un robots.txt existent.
2. **Alors** les pages privées (création, compte, CV) sont exclues de l'indexation.
3. **Alors** le score SEO Lighthouse est d'au moins 90 sur l'accueil et les tarifs.

### Épopée E13 — Multilingue (demande du 23/11/2026, ADR-018)

#### US-41 — Utiliser le site dans ma langue
**En tant que** visiteur, **je veux** utiliser le site en français, anglais, italien, espagnol ou
allemand **afin de** tout comprendre dans ma langue.
ADR-018, H29, H31 à H33 · Must · Lot MVP (fondations en Inc-0, textes à chaque incrément) · Valeur haute · L

1. **Étant donné** une première visite sur `/`, **alors** le visiteur est redirigé vers la langue
   de son navigateur si elle est proposée, sinon vers l'anglais.
2. **Alors** un sélecteur de langue est présent dans l'en-tête et le pied de page ; le choix est
   mémorisé et, pour un utilisateur connecté, enregistré dans son profil.
3. **Alors** chaque page publique a une adresse propre à sa langue, avec des chemins traduits
   (ex. `/fr/tarifs`, `/en/pricing`, `/it/prezzi`).
4. **Alors** tous les textes de l'interface, messages d'erreur, e-mails (code de connexion,
   avertissement de rétention), pages légales et le parcours Stripe (Checkout, portail) sont
   affichés dans la langue choisie ; le nom de marque et le logo suivent la langue (H31).
5. **Alors** aucun texte d'interface n'est écrit en dur dans le code, et chaque langue contient
   exactement les mêmes clés de traduction que le français (test en CI).

#### US-42 — Choisir la langue de mon CV et de mes contenus
**En tant qu'**utilisateur, **je veux** choisir la langue dans laquelle l'IA rédige **afin de**
postuler dans un autre pays que celui de ma langue.
ADR-018, H30 · Must · Lot MVP (CV, Inc-4) et V1 (outils, Inc-7 à 9) · Valeur haute · M

1. **Alors** avant la génération, un sélecteur « Langue du CV » propose les 5 langues, réglé par
   défaut sur la langue de l'interface.
2. **Étant donné** des réponses en français et la langue du CV réglée sur l'anglais, **quand** le
   CV est généré, **alors** tout le contenu et les titres de sections sont en anglais.
3. **Alors** l'aperçu, le PDF, le DOCX et le filigrane utilisent la langue du CV, quelle que soit
   la langue de l'interface.
4. **Alors** lettre, LinkedIn, entretien et adaptation sont générés par défaut dans la langue du
   CV, avec un sélecteur pour en changer avant chaque génération.
5. **Alors** le coût en crédits ne dépend pas de la langue.

#### US-43 — Choisir le modèle de mon CV
**En tant qu'**utilisateur, **je veux** choisir la mise en page de mon CV parmi plusieurs modèles
**afin de** présenter mon parcours comme on l'attend dans le pays visé.
ADR-050 (demande de l'utilisateur du 25/11/2026) · Must · Inc-15 · Valeur haute · L

1. **Alors** six modèles sont proposés : ATS classique, format européen, ATS moderne,
   Lebenslauf, moderne et élégant, chacun avec une miniature, une description et ses badges
   (gratuit ou avec une formule, compatible ATS, photo facultative).
2. **Quand** je choisis un modèle dans l'aperçu, **alors** il est enregistré aussitôt et le
   contenu ne change pas ; je peux changer de modèle à tout moment.
3. **Alors** ATS classique et format européen se téléchargent pour tous ; les autres demandent un
   abonnement ou CV Pro. Sans ce droit, le modèle s'essaie avec un aperçu du PDF marqué
   « Aperçu », et son téléchargement est refusé par le serveur.
4. **Alors** les modèles « ATS » restent sur une colonne (H34) ; les autres signalent qu'ils sont
   moins bien lus par certains logiciels de recrutement. Le DOCX reste un document Word simple.

#### US-44 — Voir les modèles adaptés au pays visé
**En tant qu'**utilisateur, **je veux** indiquer le pays où je postule **afin que** les modèles
attendus dans ce pays me soient proposés en premier.
ADR-050 · Must · Inc-15 · Valeur haute · M

1. **Alors** le pays visé se choisit avec la langue du CV (par défaut : la région du navigateur,
   sinon la langue du site), puis dans la galerie des modèles, par continent.
2. **Alors** les modèles adaptés au pays sont en tête, avec un badge, et un conseil indique la
   place de la photo dans ce pays (courante, facultative, déconseillée).
3. **Quand** un CV est créé, **alors** il reçoit le premier modèle adapté qu'il peut télécharger
   (un modèle gratuit sans formule), ou le modèle choisi dans la vitrine.

#### US-45 — Ajouter une photo à mon CV
**En tant qu'**utilisateur, **je veux** ajouter une photo **afin de** suivre l'usage des pays où
elle est attendue.
ADR-050 · Should · Inc-15 · Valeur moyenne · M

1. **Alors** un champ photo apparaît avec les modèles qui en prévoient une ; l'image est recadrée
   au format portrait dans le navigateur, puis envoyée en JPEG (au plus 300 Ko).
2. **Alors** la photo n'est visible que par son propriétaire et dans ses exports ; elle n'est
   jamais envoyée à l'IA (RLS, `cv_photos`).
3. **Alors** je peux la changer ou la retirer ; elle disparaît avec le CV et avec le compte.

#### US-46 — Découvrir les modèles avant de créer mon CV
**En tant que** visiteur, **je veux** voir les modèles par pays sur l'accueil et sur une page
dédiée **afin de** choisir mon modèle avant de répondre aux questions.
ADR-050 · Should · Inc-15 · Valeur moyenne · S

1. **Alors** l'accueil montre la galerie par pays et un lien vers la page « Modèles de CV »
   (5 langues, adresses traduites, dans le plan du site).
2. **Quand** je choisis un modèle, **alors** il est gardé dans le brouillon et donné au CV créé.

---

## 5. Exigences non fonctionnelles

| # | Exigence | Mesure |
|---|----------|--------|
| NFR-01 | Performance des pages publiques | LCP < 2,5 s, CLS < 0,1, INP < 200 ms (mobile) ; Lighthouse Performance ≥ 90 |
| NFR-02 | Durée des générations IA | CV : < 30 s au P95 ; adaptation, lettre, entretien : < 45 s au P95 (mesurés en Inc-4 et Inc-7) |
| NFR-03 | Sécurité | RLS sur 100 % des tables ; écritures sur crédits, abonnements et achats uniquement côté serveur ; validation Zod de toute entrée ; webhooks signés ; aucun secret dans le dépôt ; limites de débit par formule (H11) |
| NFR-04 | Confidentialité | Hébergement UE ; aucun traceur non essentiel sans consentement ; données des CV envoyées à l'IA uniquement pour la génération demandée |
| NFR-05 | Accessibilité | WCAG 2.2 niveau AA sur le parcours principal |
| NFR-06 | Compatibilité | Deux dernières versions de Chrome, Edge, Firefox et Safari (ordinateur, iOS, Android) |
| NFR-07 | Suivi des coûts IA | Tokens et coût enregistrés pour chaque opération (marge Premium, ADR-006) |
| NFR-08 | Intégrité des crédits | Chaque mouvement est journalisé ; la somme du journal égale le solde (test) |
| NFR-09 | Internationalisation | 5 langues complètes (test de parité des clés) ; aucune mise en page cassée avec des textes 35 % plus longs (allemand) ; tests de bout en bout de l'accueil dans les 5 langues et du parcours complet en français et en anglais |

---

## 6. Priorisation MoSCoW et lots

L'INTAKE (§19) déclare tout son périmètre obligatoire : toutes ses exigences sont **Must**.
L'ordre de livraison distingue deux lots.

| Lot | Incréments | Stories |
|-----|------------|---------|
| **MVP** — parcours §14 complet, monétisation comprise, 5 langues | Inc-0 à Inc-6 | US-01 à US-23, US-36, US-37, US-38, US-41, US-42 (CV) |
| **V1** — outils avancés, historique, publicités, finitions, mise en production | Inc-7 à Inc-13 | US-24 à US-35, US-39, US-40 |

| Incrément | Stories |
|-----------|---------|
| Inc-0 Socle | US-41 (routage par langue, messages, sélecteur) |
| Inc-1 Accueil + Tarifs | US-01, US-02, US-03, US-38 (pages) |
| Inc-2 Comptes | US-04, US-05, US-06 |
| Inc-3 Crédits & droits | US-07, US-08, US-09 |
| Inc-4 Création de CV | US-10 à US-15, US-42 (langue du CV) |
| Inc-5 Exports | US-16, US-17 |
| Inc-6 Paiements | US-18 à US-23, US-38 (CGV) |
| Inc-7 Amélioration IA | US-25, US-26, US-27 |
| Inc-8 LinkedIn + lettre | US-28, US-29 |
| Inc-9 Entretien | US-30 |
| Inc-10 Historique | US-31 |
| Inc-11 Publicités | US-24, US-32 à US-35 |
| Inc-12 Finitions | US-39, audit final de US-36 et US-37 |
| Inc-13 Mise en production | US-40 |

**Should** : US-39. **Could** : aucune.

**Won't (cette version)** : application mobile ; back-office ; choix entre plusieurs modèles de
CV ; photo sur le CV ; import d'un CV existant ; espace conseils carrière ; blog ;
statistiques d'usage ; export en fichier de la lettre ou de la version LinkedIn ; renommer un CV ;
partage d'un CV par lien ; parrainage ; codes promo.

---

## 7. Traçabilité INTAKE ↔ stories

### Périmètre §19 (20 éléments)

| # | Exigence §19 | Stories |
|---|--------------|---------|
| 1 | Page d'accueil | US-01, US-02, US-03 |
| 2 | Création de CV à partir de cinq questions | US-10 |
| 3 | Génération de CV avec IA | US-11 |
| 4 | Aperçu complet du CV | US-12 |
| 5 | Copie et modification manuelle | US-13, US-14 |
| 6 | Export PDF avec filigrane | US-16 (et US-17 sans filigrane) |
| 7 | Amélioration des expériences et accroches | US-25, US-26 |
| 8 | Adaptation du CV aux offres d'emploi | US-27 |
| 9 | Analyse des mots-clés manquants | US-27 |
| 10 | Versions LinkedIn | US-28 |
| 11 | Lettres de motivation | US-29 |
| 12 | Simulation d'entretien | US-30 |
| 13 | Historique des CV | US-31 |
| 14 | Système de crédits IA | US-07, US-08, US-09 |
| 15 | Achat unique CV Pro | US-19 |
| 16 | Abonnements mensuel et annuel | US-20, US-21, US-22, US-23 |
| 17 | Publicités pour les utilisateurs gratuits | US-32, US-33, US-34 |
| 18 | Vidéos récompensées | US-35 |
| 19 | Suppression définitive des publicités | US-24 |
| 20 | Packs et offres additionnelles | US-18 |

### Autres sections

| Section | Stories |
|---------|---------|
| §2 Identité visuelle | US-37 (+ socle Inc-0) |
| §3 Structure (10 espaces) | Accueil US-01–03 · Création US-10–11 · Consultation US-12–14 · Amélioration US-25–27 · LinkedIn US-28 · Lettres US-29 · Entretien US-30 · Historique US-31 · Crédits et abonnements US-07, US-18–24 · Compte US-04–06 |
| §11 Crédits | US-08, US-18 |
| §12 Formules et règles | US-03, US-07, US-09, US-17, US-20 à US-24, US-26 |
| §13 Publicités | US-24, US-32 à US-35 |
| §14 Parcours | US-01, US-10 à US-16, US-18 à US-21 |
| §15 Présentation commerciale | US-03, US-21 |
| §16 Responsive | US-36 |
| §17 Expérience utilisateur | US-07, US-08, US-11, US-37 |
| §18 Paiements | US-18 à US-24, US-38 |
| RGPD (H16, H28) | US-06, US-40 |
| Multilingue (demande du 23/11/2026, ADR-018) | US-41, US-42 ; critères ajoutés à US-01, US-16, US-38, US-39 |

**Couverture : chaque exigence de l'INTAKE est couverte par au moins une story.**

---

## 8. Definition of Done de la phase 1

- [x] Chaque exigence de l'INTAKE est couverte par au moins une story (§7).
- [x] Chaque story a des critères d'acceptation testables (seuils chiffrés quand c'est mesurable).
- [x] Le MVP est isolé du lot V1 (§6).

## 9. Passation → Project Manager (phase 2)

Entrées transmises : backlog de 42 stories priorisé, découpé par incrément (§6), matrice des droits
(§3), exigences non fonctionnelles (§5). À produire en phase 2 : jalons démontrables, ordre fin des
stories dans chaque incrément, risques mis à jour.
