# Plan d'acquisition : faire connaître Mon CV en 30 Secondes

> Proposé le 25/11/2026 par Claude (rôles : SEO, produit). Statut : **validé le 25/11/2026**
> (décisions du §8, ADR-052), mise en œuvre par phases. Ce plan est revu chaque lundi avec les
> chiffres du §7.

## 1. Point de départ

- Le site est en ligne depuis le 25/11/2026. Le domaine est neuf : aucun lien entrant, aucune
  ancienneté. Google mettra plusieurs semaines à lui faire confiance, et les recherches les plus
  disputées (« cv gratuit ») sont hors de portée pendant des mois.
- Ce qui joue déjà pour nous :
  - chaque PDF gratuit porte la mention discrète « Créé avec Mon CV en 30 Secondes » : chaque CV
    envoyé montre le site à des recruteurs et à des proches ;
  - premier CV gratuit, sans carte bancaire ;
  - 5 langues, 44 pays et 6 modèles adaptés au pays visé ;
  - une IA qui n'invente rien (mesuré : ADR-041 et ADR-051) ;
  - la provenance des visites est déjà comptée par canal (ADR-040).
- Ce qui manque :
  - des pages qui répondent à ce que les gens cherchent sur Google ;
  - une raison de partager le site ;
  - savoir quel canal amène des comptes et des achats, pas seulement des visites.

## 2. Ce que les gens cherchent (France, recherches par mois)

Source : Ubersuggest, 25/11/2026. Difficulté de 0 (facile) à 100 (très disputé).

| Recherche | Par mois | Difficulté | Pour nous |
|-----------|---------:|-----------:|-----------|
| lettre de motivation | 165 000 | 50 | plus tard |
| exemple de lettre de motivation | 40 500 | 37 | moyen terme |
| modèle pour lettre de motivation | 33 100 | 21 | **cible** |
| lettre de motivation parcoursup | 14 800 | 10 | **cible, saison janvier-mars** |
| lettre de motivation de stage | 14 800 | 26 | **cible** |
| lettre de motivation stage de 3e | 8 100 | 8 | **cible, saison maintenant** |
| lettre de motivation : comment faire | 6 600 | 14 | **cible** |
| lettre de motivation candidature spontanée | 6 600 | 35 | moyen terme |
| cv gratuit | 60 500 | 62 | hors de portée |
| modèle cv | 33 100 | 38 | moyen terme (page Modèles existante) |
| comment faire un cv | 6 600 | 33 | moyen terme |
| cv ia | 3 600 | 42 | moyen terme |
| modèle cv simple | 2 400 | 25 | **cible** |
| test cv ats | 1 600 | 30 | **cible (outil gratuit)** |

Longue traîne repérée, sans volume détaillé : modèle de CV étudiant, sans expérience,
aide-soignant, infirmière, comptable, de 3e, sans photo, en anglais ; CV pour la Suisse.

Ce qu'on en tire :

- **La lettre de motivation est la plus grande porte d'entrée**, avec des recherches faciles
  (difficulté 8 à 26). Le site sait écrire ces lettres.
- Les recherches « cv gratuit sans payer », « sans inscription », « pdf sans payer » montrent une
  méfiance envers les sites « gratuits » qui font payer au téléchargement. Notre message doit dire
  clairement ce qui est gratuit.
- En publicité, un clic coûte environ 0,90 $ sur « exemple de lettre de motivation », contre
  environ 5 $ sur « cv gratuit ».

## 3. Le message

- Promesse : **« Ton CV prêt en 30 secondes. Gratuit, sans carte bancaire. »**
- Preuves : aperçu immédiat ; modèle adapté au pays visé ; l'IA ne rajoute rien que tu n'as pas
  dit.
- Honnêteté : le PDF gratuit porte une petite mention ; la première lettre est offerte, les
  suivantes et l'adaptation à une offre se paient en crédits ou sont incluses dans les formules.
- Exception : l'article Parcoursup ne propose pas de faire rédiger la lettre par l'IA, car
  Parcoursup demande de ne pas utiliser ce type d'outil ; il propose de créer son CV.

## 4. Les leviers, par ordre de priorité

| # | Levier | Qui | Coût | Premiers effets |
|---|--------|-----|------|-----------------|
| 1 | Mesure par canal | Claude | 0 € | immédiat |
| 2 | Pages utiles trouvées sur Google | Claude | 0 € | 2 à 6 mois |
| 3 | Outil gratuit « Test ATS de ton CV » | Claude | 0 € | 1 à 3 mois |
| 4 | Partage après téléchargement et parrainage | Claude | crédits offerts | immédiat |
| 5 | Vidéo de démonstration | Claude | 0 € | dès publication |
| 6 | Visibilité dans les IA (ChatGPT, Perplexity, Gemini) | Claude | 0 € | 1 à 3 mois |
| 7 | Kit de lancement : annuaires, Product Hunt, réseaux | Claude rédige, toi publies | 0 € | dès publication |
| 8 | Partenariats : écoles, missions locales, associations | toi, avec les modèles | 0 € | 1 à 2 mois |
| 9 | Publicité payante | plus tard | décision 3 | immédiat |

### 4.1 Mesure par canal (en premier)

- Garder la source de la première visite (lien `utm_source` ou site d'origine) jusqu'à
  l'inscription et au premier achat, sans cookie de suivi.
- Tableau d'administration : canal, visites, CV créés, comptes, achats.
- Sans cette mesure, impossible de savoir où mettre ton temps et ton argent.
- La politique de confidentialité sera complétée dans les 5 langues.

### 4.2 Pages utiles trouvées sur Google

- Une rubrique « Conseils » dans les 5 langues, avec ces premières pages en français :
  - **lettres (8)** : stage de 3e, Parcoursup, stage, alternance, candidature spontanée, job
    étudiant, reconversion, lettre simple et courte ;
  - **CV (8)** : étudiant sans expérience, stage de 3e, aide-soignant, infirmier, vente et
    caisse, comptable, CV simple, CV en anglais ;
  - **pays (6)** : Suisse, Belgique, Canada (Québec), Allemagne, Royaume-Uni, Luxembourg, reliés
    aux modèles par pays.
- Chaque page : deux ou trois exemples complets et réalistes, la structure à suivre, les erreurs
  à éviter, une FAQ, un bouton « Créer le mien en 30 secondes », des données structurées et des
  liens entre les pages.
- **Qualité avant quantité** : Google pénalise les pages produites en masse sans valeur. Chaque
  page est unique et écrite pour être utile, sans tiret long.
- Rythme :
  - les 22 premières pages en français en 2 à 3 semaines, en commençant par la saison (stage de
    3e, puis Parcoursup) ;
  - ensuite, 2 pages par semaine ;
  - les pages qui marchent dans Search Console sont adaptées en italien, espagnol, allemand et
    anglais.

### 4.3 Outil gratuit « Test ATS de ton CV »

- Le visiteur dépose son CV en PDF et obtient une note sur 100 avec les corrections à faire :
  - sections présentes, dates et coordonnées lisibles ;
  - longueur ;
  - texte lisible par les logiciels de recrutement (ATS).
- L'outil n'utilise pas l'IA, donc ne coûte rien, et ne demande aucun compte.
- Le fichier est lu en mémoire et jamais gardé.
- Bouton final : « Corriger mon CV en 30 secondes ».
- Ce genre d'outil attire des liens et des partages, au-delà des 1 600 recherches par mois.

### 4.4 Partage après téléchargement et parrainage

- Après le premier PDF, proposer « Un ami cherche du travail ? Envoie-lui le lien », par
  WhatsApp, LinkedIn ou en copiant le lien.
- Parrainage (selon la décision 1) :
  - un lien personnel dans le compte ;
  - quand le filleul crée son premier CV, le parrain et le filleul reçoivent des crédits.
- Garde-fous contre les abus :
  - e-mail vérifié ;
  - protection anti-robots déjà en place ;
  - plafond de filleuls récompensés par mois ;
  - pas de récompense pour un compte qu'on se parraine soi-même.

### 4.5 Vidéo de démonstration

- Enregistrement réel du parcours, du formulaire au PDF en 30 secondes, dans les 5 langues :
  - au format vertical pour TikTok, Instagram et YouTube Shorts ;
  - au format horizontal pour l'accueil et Product Hunt.

### 4.6 Visibilité dans les IA

- Les assistants comme ChatGPT, Perplexity ou Gemini répondent de plus en plus à « quel site pour
  faire un CV gratuit ? ».
- Pour être cité :
  - un fichier `llms.txt` qui décrit le site aux IA ;
  - une FAQ en données structurées ;
  - une page « À propos » (qui, pourquoi, comment l'IA est encadrée) ;
  - une présence dans les annuaires et les comparatifs (levier 7).

### 4.7 Kit de lancement (je rédige, tu publies)

- Textes prêts dans les 5 langues pour Product Hunt, AlternativeTo, BetaList, les annuaires
  d'outils IA et de logiciels, et les annuaires français de startups. Avec la liste des sites et
  leurs liens.
- Pour les réseaux :
  - 30 scripts de vidéos courtes, avec légendes et hashtags ;
  - 12 posts LinkedIn ;
  - des messages pour les groupes Facebook et Reddit, utiles d'abord, jamais du spam.
- Publier depuis tes comptes reste ton geste : ces sites demandent ton compte, et une publication
  t'engage publiquement.

### 4.8 Partenariats

- Cibles :
  - missions locales ;
  - services stages et carrières des écoles et universités ;
  - centres de formation ;
  - associations d'aide à l'emploi et d'accueil des migrants ;
  - associations étudiantes.
- Offre : un lien dédié (suivi par le levier 1) et, si tu le veux plus tard, un code de réduction
  pour leurs membres.
- Je fournis l'e-mail de premier contact et celui de relance.

### 4.9 Publicité payante (plus tard)

- Seulement quand la mesure (levier 1) dit combien rapporte un visiteur.
- Premier test conseillé : Google Ads sur « exemple de lettre de motivation » (environ 0,90 $ le
  clic) vers les pages d'exemples, ou la vidéo de démonstration sur TikTok ou Instagram.

## 5. Ce que tu dois faire de ton côté

| Quand | Quoi | Temps |
|-------|------|-------|
| Une fois | Créer les comptes de la marque, avec le même nom partout : TikTok, Instagram, YouTube, page LinkedIn, page Facebook | 1 h |
| Une fois | Inscrire le site dans les annuaires avec les textes fournis (environ 15 sites) | 3 h |
| Une fois | Lancer sur Product Hunt un mardi, mercredi ou jeudi, en prévenant ton réseau la veille | 2 h |
| Une fois | Ouvrir un profil Trustpilot et demander un avis aux premiers utilisateurs contents | 1 h |
| Chaque semaine | Publier 3 vidéos courtes avec les scripts fournis ; ta voix ou ton visage marchent mieux qu'une publicité | 2 h |
| Chaque semaine | 2 posts LinkedIn personnels : raconter la construction du site | 1 h |
| Chaque semaine | 3 partages utiles dans des groupes qui l'autorisent : aider d'abord, le lien ensuite | 1 h |
| Chaque semaine | 10 e-mails de partenariat avec le modèle fourni, relance à 7 jours | 1 h |
| Chaque lundi | Lire le point de la semaine (je peux le préparer pour toi) | 10 min |

## 6. Calendrier (12 semaines)

| Semaines | Claude | Toi |
|----------|--------|-----|
| 1 | Mesure par canal ; partage après téléchargement ; pages « stage de 3e » (lettre et CV) et Parcoursup ; vidéo de démonstration | Comptes de la marque |
| 2 et 3 | Test ATS ; reste des 22 pages ; parrainage ; kit de lancement | Annuaires ; premières vidéos |
| 4 | `llms.txt`, page « À propos », FAQ | Product Hunt ; groupes et communautés |
| 5 à 12 | 2 pages par semaine ; traductions des pages qui marchent ; point du lundi ; proposition chiffrée de publicité vers la semaine 8 | Vidéos, LinkedIn, partenariats |

Saisons à ne pas manquer :

- stage de 3e : décembre et janvier, donc maintenant ;
- Parcoursup : janvier à mars ;
- jobs d'été : mars à mai ;
- alternance : avril à septembre ;
- rentrée : septembre.

## 7. Indicateurs (revus chaque lundi)

- Visites par canal, et pages d'arrivée.
- Taux de conversion à chaque étape :
  - visite vers CV créé ;
  - CV créé vers compte ;
  - compte vers premier achat.
- Pages indexées et positions dans Search Console.
- Objectifs de travail à 12 semaines :
  - les 22 pages indexées ;
  - au moins 5 recherches faciles du §2 en première page de Google ;
  - un canal identifié qui amène des achats.

  Ce sont des objectifs, pas des promesses : un domaine neuf reste lent à démarrer sur Google.

## 8. Décisions prises le 25/11/2026 (ADR-052)

1. **Parrainage** : 5 crédits pour le parrain et 5 pour le filleul, au premier CV du filleul.
2. **Lettre de motivation** : une lettre offerte par compte, sans formule.
3. **Publicité payante** : 0 € pour l'instant ; proposition chiffrée vers la semaine 8.
4. **Marchés** : France d'abord ; les autres langues suivent les résultats de Search Console.
