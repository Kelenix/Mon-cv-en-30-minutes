# Registre des risques

> Phase 2 — Planification (rôle : Project Manager). Mis à jour le 23/11/2026.
> Niveau = probabilité × impact : 🔴 critique · 🟠 élevé · 🟡 modéré · 🟢 faible.
> Un risque 🔴 sans parade remonte à l'utilisateur. Revue à la fin de chaque incrément.

| # | Risque | Catégorie | Prob. | Impact | Niveau | Parade | Incrément | État |
|---|--------|-----------|-------|--------|--------|--------|-----------|------|
| R01 | Un abonné Premium annuel qui consomme ses 150 crédits coûte plus qu'il ne rapporte avec Claude Opus 5.5 | Coût | Moyenne | Fort | 🟠 | Effort de réflexion bas, sorties courtes et structurées, cache de prompt, coût enregistré par opération (NFR-07), modèle modifiable par configuration | Inc-4 | Accepté par l'utilisateur (ADR-006) |
| R02 | La génération d'un CV dépasse 30 s au P95 (NFR-02) | Technique | Moyenne | Fort | 🟠 | Mesure dès le début de l'Inc-4 sur 20 profils ; effort bas, schéma de sortie concis, affichage des étapes. Si l'objectif n'est pas tenu : question à l'utilisateur (mode rapide plus cher, ou objectif revu) | Inc-4 | Ouvert |
| R03 | Non-conformité : RGPD, cookies publicitaires, droit de rétractation, résiliation en ligne, promesses de prix | Légal | Moyenne | Fort | 🟠 | Bandeau certifié (US-32), pages légales (US-38), case de renonciation (US-18), portail Stripe (US-22), prix et économies calculés (ADR-002), relecture par un juriste (tâche 7) | Inc-1, 6, 11 | Ouvert |
| R04 | TVA : Stripe n'est pas marchand officiel ; déclarations TVA (dont guichet unique OSS pour les clients UE) à la charge du vendeur | Légal / coût | Haute | Moyen | 🟠 | Prix affichés TTC ; option Stripe Tax pour le calcul ; vérification des obligations avec un expert-comptable (tâche 7) | Inc-6 | Ouvert |
| R05 | L'IA invente des expériences, chiffres ou diplômes | Produit | Moyenne | Fort | 🟠 | Consignes strictes, sortie structurée validée, jeu de 20 profils de référence vérifié (US-11, US-25, US-27), modification manuelle toujours possible | Inc-4, 7 | Ouvert |
| R06 | Injection de consignes via le texte d'une annonce | Sécurité | Moyenne | Moyen | 🟠 | Annonce encadrée comme donnée, sortie structurée, aucun outil exposé au modèle, test d'injection (US-27) | Inc-7 | Ouvert |
| R07 | Double débit ou solde négatif lors d'opérations simultanées | Technique | Moyenne | Fort | 🟠 | Débit dans une fonction Postgres avec verrou de ligne, journal non modifiable, test de concurrence (US-08, NFR-08) | Inc-3 | Ouvert |
| R08 | Notifications Stripe reçues en double ou dans le désordre | Technique | Moyenne | Fort | 🟠 | Journal d'idempotence des événements, état relu depuis Stripe à chaque événement d'abonnement | Inc-6 | Ouvert |
| R09 | Le PDF exporté ne ressemble pas à l'aperçu | Produit | Moyenne | Moyen | 🟡 | Un seul modèle de données de CV et des constantes de mise en page partagées entre l'aperçu et le PDF ; comparaison visuelle en test | Inc-5 | Ouvert |
| R10 | Fraude sur la vidéo récompensée (signal de fin envoyé par le navigateur) | Sécurité | Haute | Faible | 🟡 | Jeton à usage unique émis par le serveur, plafond de 3 crédits par jour (US-35) | Inc-11 | Ouvert |
| R11 | Abus du CV gratuit par comptes multiples | Coût | Moyenne | Moyen | 🟡 | Compte avec e-mail vérifié avant génération, 3 générations gratuites par IP et par jour (H27) | Inc-4 | Ouvert |
| R12 | La remise mensuelle des crédits inclus échoue ou s'exécute deux fois | Technique | Faible | Fort | 🟡 | Tâche idempotente (date de prochaine remise en base), test de relance (US-23) | Inc-6 | Ouvert |
| R13 | Comptes publicitaires non approuvés au lancement (un site public avec du trafic est exigé) | Dépendance tierce | Haute | Faible | 🟡 | Inc-11 développé avec les blocs de test de Google ; activation réelle par configuration après approbation | Inc-11 | Ouvert |
| R14 | Activation du compte Stripe (vérification d'identité) plus longue que prévu | Dépendance tierce | Moyenne | Moyen | 🟡 | Le mode test suffit jusqu'à l'Inc-13 ; activation à lancer tôt (tâche 4) | Inc-13 | Ouvert |
| R15 | E-mails de connexion non délivrés en production (SMTP Supabase par défaut très limité) | Dépendance tierce | Haute | Moyen | 🟡 | Fournisseur SMTP dédié (tâche 6) ; Mailpit en local | Inc-13 | Ouvert |
| R16 | Coûts d'hébergement commerciaux : Vercel Hobby interdit l'usage commercial, Supabase Free se met en pause | Coût | Certaine | Faible | 🟡 | Vercel Pro et Supabase Pro au lancement (plan §8) | Inc-13 | Accepté |
| R17 | Mémoire de Docker Desktop (environ 7,5 Go alloués) saturée par la pile Supabase locale | Technique | Faible | Faible | 🟢 | Services Supabase inutiles désactivés (ADR-007) | Inc-0 | Ouvert |
| R18 | Changements entre versions majeures (CLI Supabase 3, Next.js, Tailwind) par rapport à la documentation connue | Technique | Moyenne | Faible | 🟢 | Versions vérifiées sur le registre npm et épinglées, fichier de verrouillage versionné, CI | Inc-0 | Ouvert |
| R19 | Traductions maladroites ou inexactes (interface, pages légales, prompts) | Produit | Moyenne | Moyen | 🟡 | Français comme référence, glossaire unique par langue, test de parité des clés, relecture par des locuteurs natifs (tâche 12) | Chaque incrément | Ouvert |
| R20 | Droit de la consommation propre à chaque pays de vente (Italie, Espagne, Allemagne…) en plus du droit français | Légal | Moyenne | Fort | 🟠 | Relecture juridique des CGV et de la confidentialité pour chaque langue et pays visé (tâche 7) avant le lancement | Inc-13 | Ouvert |
| R21 | Référencement multilingue mal configuré (contenu dupliqué, mauvaise langue indexée) | Technique | Faible | Moyen | 🟢 | Préfixes de langue, chemins traduits, `hreflang` et `x-default`, sitemap par langue, vérifiés en Inc-12 | Inc-12 | Ouvert |

**Aucun risque 🔴 à ce jour.** R02 est le seul qui pourrait déclencher une question (vitesse
contre coût), après mesure réelle en Inc-4.
