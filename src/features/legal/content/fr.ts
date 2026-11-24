import type { LegalContent } from "../types";

// Texte de référence. À faire relire par un juriste avant le lancement (tâche manuelle 7).
export const fr: LegalContent = {
  updatedAt: "2026-11-23",
  pages: {
    legalNotice: {
      title: "Mentions légales",
      description:
        "Éditeur, directeur de la publication et hébergeur du site {brandName}.",
      sections: [
        {
          title: "Éditeur du site",
          paragraphs: [
            "Le site {siteUrl} ({brandName}) est édité par {companyName}.",
            "Forme juridique : {legalForm}.",
            "Numéro d'immatriculation : {registration}.",
            "Siège : {address}.",
            "Numéro de TVA intracommunautaire : {vatNumber}.",
            "Contact : {email}.",
          ],
        },
        {
          title: "Directeur de la publication",
          paragraphs: ["{publisher}."],
        },
        {
          title: "Hébergement",
          paragraphs: [
            "Le site est hébergé par {hosting}.",
            "Les données des comptes sont stockées sur le même serveur, situé dans l'Union européenne.",
          ],
        },
        {
          title: "Propriété intellectuelle",
          paragraphs: [
            "La marque {brandName}, le logo, les illustrations, les textes et le code du site sont protégés. Toute reproduction sans autorisation écrite est interdite.",
            "Les contenus que vous saisissez et les CV générés pour vous vous appartiennent.",
          ],
        },
      ],
    },
    terms: {
      title: "Conditions générales d'utilisation et de vente",
      description:
        "Règles d'utilisation du service {brandName}, des crédits IA, des achats et des abonnements.",
      sections: [
        {
          title: "Objet",
          paragraphs: [
            "Les présentes conditions régissent l'utilisation du service {brandName}, accessible sur {siteUrl} et exploité par {companyName}. Elles s'appliquent dès la création d'un compte et à chaque achat.",
          ],
        },
        {
          title: "Le service",
          paragraphs: [
            "{brandName} permet de créer un CV à l'aide de l'intelligence artificielle à partir de cinq questions, puis d'améliorer ses candidatures : amélioration des expériences et de l'accroche, adaptation à une offre d'emploi avec analyse des mots-clés manquants, version LinkedIn, lettre de motivation et simulation d'entretien.",
            "La première génération de CV est gratuite. Les autres fonctions utilisent des crédits IA ou sont incluses dans une formule d'abonnement, comme indiqué sur la page Tarifs.",
            "Les contenus produits par l'intelligence artificielle sont des propositions : vous devez les relire et les corriger avant de les utiliser. Le service ne garantit pas l'obtention d'un entretien ou d'un emploi.",
          ],
        },
        {
          title: "Compte",
          paragraphs: [
            "Un compte est nécessaire pour générer et enregistrer un CV. Vous vous engagez à fournir des informations exactes et à garder l'accès à votre adresse e-mail confidentiel.",
          ],
        },
        {
          title: "Crédits IA",
          paragraphs: [
            "Chaque opération d'intelligence artificielle consomme des crédits : 1 crédit pour générer un CV, améliorer une expérience, améliorer une accroche ou créer une version LinkedIn ; 2 crédits pour adapter un CV à une offre d'emploi (analyse des mots-clés comprise), générer une lettre de motivation ou simuler un entretien.",
            "Les crédits inclus dans un abonnement sont remis au niveau de la formule chaque mois, à la date anniversaire de la souscription, y compris pour un abonnement annuel ; les crédits inclus non utilisés ne sont pas reportés. Ils sont consommés avant les crédits achetés.",
            "Les crédits achetés (packs de crédits) et ceux obtenus en regardant une vidéo publicitaire restent disponibles tant que le compte existe. Ils sont perdus en cas de suppression du compte, qu'elle soit demandée par vous ou qu'elle intervienne après trois ans d'inactivité.",
            "Si une opération échoue, les crédits débités sont rendus automatiquement.",
          ],
        },
        {
          title: "Offres et prix",
          paragraphs: [
            "Les prix sont indiqués toutes taxes comprises, en euros, sur la page Tarifs, avant tout achat.",
            "Les packs de crédits sont des achats uniques. Le « CV Pro » débloque définitivement, pour un CV donné, l'export PDF sans filigrane et l'export DOCX ; ce déblocage est perdu si ce CV est remplacé par une nouvelle génération. Lorsqu'elle est proposée, la suppression des publicités est un achat unique et définitif pour le compte.",
            "Les formules Essential, Pro et Premium sont proposées au mois ou à l'année. Les fonctions et le nombre de crédits mensuels de chaque formule sont décrits sur la page Tarifs.",
          ],
        },
        {
          title: "Abonnements",
          paragraphs: [
            "L'abonnement se renouvelle automatiquement à la fin de chaque période (mois ou année) au prix en vigueur, par prélèvement sur le moyen de paiement enregistré auprès de notre prestataire de paiement Stripe.",
            "Vous pouvez gérer votre abonnement à tout moment depuis « Gérer mon abonnement » : un passage à une formule supérieure est immédiat et facturé au prorata ; un passage à une formule inférieure et une résiliation prennent effet à la fin de la période déjà payée.",
            "En cas d'échec de paiement, de nouvelles tentatives sont effectuées et vos droits sont maintenus pendant ce délai ; si le paiement n'aboutit pas, l'abonnement prend fin.",
          ],
        },
        {
          title: "Essai gratuit",
          paragraphs: [
            "Un essai gratuit de trois jours de la formule Pro est proposé une seule fois par compte. Un moyen de paiement est demandé, mais rien n'est prélevé pendant l'essai. L'essai donne accès aux fonctions Pro avec 10 crédits.",
            "Sans résiliation avant la fin de l'essai, l'abonnement démarre et le premier paiement est prélevé ; les 60 crédits mensuels de la formule Pro sont alors attribués.",
          ],
        },
        {
          title: "Droit de rétractation",
          paragraphs: [
            "Les crédits et le CV Pro sont des contenus numériques fournis immédiatement après le paiement. En demandant leur fourniture immédiate et en reconnaissant perdre votre droit de rétractation lors de l'achat, vous renoncez à ce droit.",
            "Pour un abonnement, vous disposez d'un délai de quatorze jours à compter de la souscription pour vous rétracter en écrivant à {email}. Si vous avez demandé que le service commence avant la fin de ce délai, le montant correspondant au service déjà fourni reste dû.",
          ],
        },
        {
          title: "Utilisation des contenus",
          paragraphs: [
            "Vous restez propriétaire des informations que vous saisissez et des contenus générés pour vous. Vous vous engagez à ne pas utiliser le service pour produire des informations fausses ou des contenus illicites.",
          ],
        },
        {
          title: "Responsabilité",
          paragraphs: [
            "Nous mettons en œuvre des moyens raisonnables pour assurer l'accès au service et la sécurité de vos données, sans pouvoir garantir une disponibilité permanente. Notre responsabilité ne saurait être engagée pour l'usage que vous faites des contenus générés.",
          ],
        },
        {
          title: "Données personnelles",
          paragraphs: [
            "Le traitement de vos données est décrit dans la politique de confidentialité.",
          ],
        },
        {
          title: "Suppression du compte",
          paragraphs: [
            "Vous pouvez supprimer votre compte à tout moment depuis votre espace. La suppression entraîne la résiliation immédiate de l'abonnement en cours, sans remboursement de la période entamée, ainsi que la perte des CV, des contenus générés et des crédits.",
            "Un compte sans abonnement actif et inactif depuis trois ans est supprimé automatiquement ; un e-mail vous prévient trente jours avant.",
          ],
        },
        {
          title: "Réclamations, médiation et droit applicable",
          paragraphs: [
            "Pour toute réclamation, écrivez d'abord à {email}.",
            "Si aucune solution n'est trouvée, vous pouvez recourir gratuitement au médiateur de la consommation : {mediator}.",
            "Les présentes conditions sont soumises au droit français, sans vous priver de la protection des règles impératives du pays où vous résidez.",
          ],
        },
        {
          title: "Modification des conditions",
          paragraphs: [
            "Nous pouvons modifier ces conditions ; vous en êtes informé avant leur entrée en vigueur. Pour un abonnement en cours, les nouvelles conditions s'appliquent au renouvellement suivant.",
          ],
        },
      ],
    },
    privacy: {
      title: "Politique de confidentialité",
      description:
        "Données personnelles traitées par {brandName}, finalités, durées de conservation et droits.",
      sections: [
        {
          title: "Responsable du traitement",
          paragraphs: [
            "{companyName}. Contact pour toute question sur vos données : {email}.",
            "Adresse : {address}.",
          ],
        },
        {
          title: "Données traitées",
          paragraphs: [
            "Compte : adresse e-mail, prénom, nom et, si vous les renseignez, téléphone et ville.",
            "Contenu : vos réponses aux questions, vos CV et les contenus générés (lettres, versions LinkedIn, simulations d'entretien).",
            "Utilisation : opérations réalisées, crédits, formule et achats. Les données de carte bancaire sont traitées uniquement par Stripe ; nous ne conservons que les références des paiements.",
            "Technique : adresse IP sous forme hachée (transformée de façon irréversible) pour prévenir les abus, journaux techniques, préférence de langue, pays déduit de l'adresse IP lors de la première connexion (l'adresse elle-même n'est pas conservée).",
          ],
        },
        {
          title: "Finalités et bases légales",
          paragraphs: [
            "Fournir le service, gérer votre compte, vos crédits et vos abonnements : exécution du contrat.",
            "Facturation et obligations comptables : obligation légale.",
            "Prévention des abus et suivi des coûts du service : intérêt légitime.",
            "Statistiques internes de fréquentation (site ou campagne d'origine, pays), anonymes, sans cookie et sans lien avec votre compte : intérêt légitime.",
            "Publicités personnalisées pour les utilisateurs sans abonnement : consentement, que vous pouvez retirer à tout moment.",
          ],
        },
        {
          title: "Durées de conservation",
          paragraphs: [
            "Les données du compte, les CV et les contenus générés sont conservés jusqu'à la suppression du compte, ou pendant trois ans d'inactivité ; un e-mail vous prévient trente jours avant la suppression automatique.",
            "L'adresse IP hachée est effacée après trente jours ; les événements de paiement techniques après quatre-vingt-dix jours. Les factures sont conservées par Stripe pendant la durée imposée par la loi.",
            "Après la suppression d'un compte, seuls le montant et la date des paiements et le coût des opérations sont gardés, sans aucun lien avec vous, pour la comptabilité et les statistiques. Les statistiques de fréquentation sont gardées vingt-cinq mois.",
            "Avant la création de votre compte, vos réponses aux cinq questions sont enregistrées uniquement dans votre navigateur, puis effacées dès que votre CV est enregistré.",
          ],
        },
        {
          title: "Destinataires et sous-traitants",
          paragraphs: [
            "Vos données ne sont jamais vendues. Elles sont traitées, pour notre compte, par : Hostinger (hébergement du site et des données, Union européenne), Anthropic (traitement des textes par l'intelligence artificielle pour produire les contenus que vous demandez), Stripe (paiements), Resend (envoi des e-mails), Cloudflare (protection contre les robots à la connexion) et, uniquement après votre consentement, Google (publicités).",
          ],
        },
        {
          title: "Transferts hors de l'Union européenne",
          paragraphs: [
            "Certains prestataires peuvent traiter des données hors de l'Union européenne, notamment aux États-Unis. Ces transferts sont encadrés par des garanties appropriées, comme une décision d'adéquation de la Commission européenne ou ses clauses contractuelles types.",
          ],
        },
        {
          title: "Intelligence artificielle",
          paragraphs: [
            "Les textes nécessaires à une opération (vos réponses, votre CV, une annonce que vous collez) sont transmis à notre prestataire d'intelligence artificielle uniquement pour produire le contenu demandé.",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            "Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, ainsi que du droit de retirer votre consentement. Vous pouvez supprimer votre compte vous-même depuis votre espace ; pour les autres demandes, écrivez à {email}.",
            "Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr) ou de l'autorité de protection des données de votre pays.",
          ],
        },
        {
          title: "Sécurité",
          paragraphs: [
            "Les échanges sont chiffrés (HTTPS) et chaque utilisateur n'accède qu'à ses propres données, contrôlé au niveau de la base de données.",
          ],
        },
        {
          title: "Cookies",
          paragraphs: [
            "L'utilisation des cookies est décrite sur la page dédiée aux cookies.",
          ],
        },
      ],
    },
    cookies: {
      title: "Gestion des cookies",
      description: "Cookies utilisés par {brandName} et gestion de vos choix.",
      sections: [
        {
          title: "Qu'est-ce qu'un cookie ?",
          paragraphs: [
            "Un cookie est un petit fichier déposé dans votre navigateur. Il permet par exemple de rester connecté ou de mémoriser une préférence.",
          ],
        },
        {
          title: "Cookies strictement nécessaires",
          paragraphs: [
            "Ces cookies sont indispensables au fonctionnement du site et ne demandent pas de consentement : session de connexion à votre compte, mémorisation de la langue choisie (au plus un an), sécurité.",
          ],
        },
        {
          title: "Cookies publicitaires",
          paragraphs: [
            "Pour les utilisateurs sans abonnement, des publicités peuvent être affichées par Google. Les cookies publicitaires ne sont déposés qu'avec votre accord, recueilli par un bandeau qui permet d'accepter ou de refuser aussi simplement. Aucun cookie publicitaire n'est utilisé pour les abonnés.",
          ],
        },
        {
          title: "Gérer vos choix",
          paragraphs: [
            "Vous pouvez modifier votre choix à tout moment avec le lien « Gérer les cookies » en bas de chaque page. Votre choix est conservé six mois. Vous pouvez aussi supprimer les cookies dans les réglages de votre navigateur.",
          ],
        },
      ],
    },
  },
};
