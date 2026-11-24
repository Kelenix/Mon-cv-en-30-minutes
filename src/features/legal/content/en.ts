import type { LegalContent } from "../types";

// Traduction de fr.ts. À faire relire par un juriste avant le lancement (tâche manuelle 7).
export const en: LegalContent = {
  updatedAt: "2026-11-23",
  pages: {
    legalNotice: {
      title: "Legal Notice",
      description:
        "Publisher, publication director and hosting provider of the {brandName} website.",
      sections: [
        {
          title: "Website publisher",
          paragraphs: [
            "The website {siteUrl} ({brandName}) is published by {companyName}, {legalForm}, registered under number {registration}, with its registered office at {address}.",
            "Intra-community VAT number: {vatNumber}.",
            "Contact: {email}.",
          ],
        },
        {
          title: "Publication director",
          paragraphs: ["{publisher}."],
        },
        {
          title: "Hosting",
          paragraphs: [
            "The website is hosted by {hosting}.",
            "Account data is stored on the same server, located in the European Union.",
          ],
        },
        {
          title: "Intellectual property",
          paragraphs: [
            "The {brandName} trademark, as well as the logo, illustrations, texts and code of the website, are protected. Any reproduction without written permission is prohibited.",
            "The content you enter and the CVs generated for you belong to you.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Use and Sale",
      description:
        "Rules for using the {brandName} service, AI credits, purchases and subscriptions.",
      sections: [
        {
          title: "Purpose",
          paragraphs: [
            "These terms govern the use of the {brandName} service, available at {siteUrl} and operated by {companyName}. They apply as soon as you create an account and to every purchase.",
          ],
        },
        {
          title: "The service",
          paragraphs: [
            "{brandName} lets you create a CV with artificial intelligence by answering five questions, and then strengthen your job applications: improving your experience entries and your summary, tailoring your CV to a job posting with an analysis of missing keywords, a LinkedIn version, a cover letter and mock interviews.",
            "Your first CV generation is free. Other features use AI credits or are included in a subscription plan, as shown on the Pricing page.",
            "Content produced by artificial intelligence is a suggestion only: you must review and correct it before using it. The service does not guarantee that you will obtain an interview or a job.",
          ],
        },
        {
          title: "Account",
          paragraphs: [
            "An account is required to generate and save a CV. You agree to provide accurate information and to keep access to your email account confidential.",
          ],
        },
        {
          title: "AI credits",
          paragraphs: [
            "Each artificial intelligence operation uses credits: 1 credit to generate a CV, improve an experience entry, improve a summary or create a LinkedIn version; 2 credits to tailor a CV to a job posting (keyword analysis included), generate a cover letter or run a mock interview.",
            "Credits included in a subscription are reset to the plan's allowance every month, on the monthly anniversary of the date you subscribed, including for annual subscriptions; unused included credits do not roll over. They are used before purchased credits.",
            "Purchased credits (credit packs) and credits earned by watching an advertising video remain available for as long as the account exists. They are lost if the account is deleted, whether at your request or after three years of inactivity.",
            "If an operation fails, the credits deducted are automatically returned to your balance.",
          ],
        },
        {
          title: "Offers and prices",
          paragraphs: [
            "Prices are shown in euros, inclusive of all taxes, on the Pricing page before any purchase.",
            "Credit packs are one-time purchases. “CV Pro” permanently unlocks, for a given CV, watermark-free PDF export and DOCX export; this unlock is lost if that CV is replaced by a new generation. Where offered, ad removal is a one-time, permanent purchase for the account.",
            "The Essential, Pro and Premium plans are available on a monthly or annual basis. The features and number of monthly credits of each plan are described on the Pricing page.",
          ],
        },
        {
          title: "Subscriptions",
          paragraphs: [
            "Your subscription renews automatically at the end of each period (month or year) at the price then in effect, by charging the payment method registered with our payment provider Stripe.",
            "You can manage your subscription at any time from “Manage my subscription”: an upgrade to a higher plan takes effect immediately and is charged on a pro rata basis; a downgrade to a lower plan and a cancellation take effect at the end of the period already paid for.",
            "If a payment fails, further attempts are made and your entitlements are maintained during that time; if the payment does not go through, the subscription ends.",
          ],
        },
        {
          title: "Free trial",
          paragraphs: [
            "A three-day free trial of the Pro plan is offered once per account. A payment method is required, but nothing is charged during the trial. The trial gives access to Pro features with 10 credits.",
            "Unless you cancel before the end of the trial, the subscription starts and the first payment is charged; the Pro plan's 60 monthly credits are then granted.",
          ],
        },
        {
          title: "Right of withdrawal",
          paragraphs: [
            "Credits and CV Pro are digital content supplied immediately after payment. By requesting their immediate supply and acknowledging, at the time of purchase, that you lose your right of withdrawal, you waive that right.",
            "For a subscription, you have fourteen days from the date you subscribe to withdraw, by writing to {email}. If you asked for the service to begin before the end of that period, the amount corresponding to the service already provided remains payable.",
          ],
        },
        {
          title: "Use of content",
          paragraphs: [
            "You remain the owner of the information you enter and of the content generated for you. You agree not to use the service to produce false information or unlawful content.",
          ],
        },
        {
          title: "Liability",
          paragraphs: [
            "We use reasonable means to ensure access to the service and the security of your data, but cannot guarantee permanent availability. We cannot be held liable for the use you make of the generated content.",
          ],
        },
        {
          title: "Personal data",
          paragraphs: [
            "The processing of your data is described in the privacy policy.",
          ],
        },
        {
          title: "Account deletion",
          paragraphs: [
            "You can delete your account at any time from your account area. Deletion results in the immediate cancellation of any current subscription, with no refund for the period already started, and in the loss of your CVs, generated content and credits.",
            "An account with no active subscription that has been inactive for three years is deleted automatically; you will be notified by email thirty days beforehand.",
          ],
        },
        {
          title: "Complaints, mediation and governing law",
          paragraphs: [
            "For any complaint, please first write to {email}. If no solution is found, you may refer the matter free of charge to the consumer mediator: {mediator}.",
            "These terms are governed by French law, without depriving you of the protection afforded by the mandatory rules of the country in which you reside.",
          ],
        },
        {
          title: "Changes to these terms",
          paragraphs: [
            "We may amend these terms; you will be informed before they take effect. For an ongoing subscription, the new terms apply from the next renewal.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      description:
        "Personal data processed by {brandName}, purposes, retention periods and your rights.",
      sections: [
        {
          title: "Data controller",
          paragraphs: [
            "{companyName}, {address}. Contact for any question about your data: {email}.",
          ],
        },
        {
          title: "Data processed",
          paragraphs: [
            "Account: email address, first name, last name and, if you provide them, phone number and city.",
            "Content: your answers to the questions, your CVs and the generated content (cover letters, LinkedIn versions, mock interviews).",
            "Usage: operations performed, credits, plan and purchases. Bank card data is processed solely by Stripe; we only keep payment references.",
            "Technical: IP address in hashed form (irreversibly transformed) to prevent abuse, technical logs, language preference.",
          ],
        },
        {
          title: "Purposes and legal bases",
          paragraphs: [
            "Providing the service and managing your account, credits and subscriptions: performance of the contract.",
            "Invoicing and accounting obligations: legal obligation.",
            "Abuse prevention and monitoring of service costs: legitimate interest.",
            "Personalised advertising for users without a subscription: consent, which you can withdraw at any time.",
          ],
        },
        {
          title: "Retention periods",
          paragraphs: [
            "Account data, CVs and generated content are kept until the account is deleted, or for three years of inactivity; you will be notified by email thirty days before automatic deletion.",
            "The hashed IP address is erased after thirty days, and technical payment events after ninety days. Invoices are kept by Stripe for the period required by law.",
            "Before you create your account, your answers to the five questions are stored only in your browser, then erased as soon as your CV is saved.",
          ],
        },
        {
          title: "Recipients and processors",
          paragraphs: [
            "Your data is never sold. It is processed on our behalf by: Hostinger (website and data hosting, European Union), Anthropic (artificial intelligence processing of text to produce the content you request), Stripe (payments), Resend (email delivery) and, only with your consent, Google (advertising).",
          ],
        },
        {
          title: "Transfers outside the European Union",
          paragraphs: [
            "Some providers may process data outside the European Union, particularly in the United States. These transfers are covered by appropriate safeguards, such as an adequacy decision of the European Commission or its standard contractual clauses.",
          ],
        },
        {
          title: "Artificial intelligence",
          paragraphs: [
            "The text required for an operation (your answers, your CV, a job posting you paste) is sent to our artificial intelligence provider solely to produce the requested content.",
          ],
        },
        {
          title: "Your rights",
          paragraphs: [
            "You have the rights of access, rectification, erasure, restriction of processing, objection and data portability, as well as the right to withdraw your consent. You can delete your account yourself from your account area; for any other request, write to {email}.",
            "You may lodge a complaint with the CNIL (www.cnil.fr), the French data protection authority, or with the data protection authority of your country.",
          ],
        },
        {
          title: "Security",
          paragraphs: [
            "Communications are encrypted (HTTPS) and each user can only access their own data, which is enforced at database level.",
          ],
        },
        {
          title: "Cookies",
          paragraphs: [
            "The use of cookies is described on the dedicated cookie page.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie Management",
      description:
        "Cookies used by {brandName} and how to manage your choices.",
      sections: [
        {
          title: "What is a cookie?",
          paragraphs: [
            "A cookie is a small file placed in your browser. For example, it lets you stay signed in or remembers a preference.",
          ],
        },
        {
          title: "Strictly necessary cookies",
          paragraphs: [
            "These cookies are essential for the website to work and do not require consent: your account login session, remembering your chosen language (for up to one year), security.",
          ],
        },
        {
          title: "Advertising cookies",
          paragraphs: [
            "For users without a subscription, ads may be displayed by Google. Advertising cookies are only placed with your consent, collected through a banner that lets you accept or refuse just as easily. No advertising cookies are used for subscribers.",
          ],
        },
        {
          title: "Managing your choices",
          paragraphs: [
            "You can change your choice at any time using the “Manage cookies” link at the bottom of every page. Your choice is stored for six months. You can also delete cookies in your browser settings.",
          ],
        },
      ],
    },
  },
};
