import type { LegalContent } from "../types";

// Traduction de fr.ts. À faire relire par un juriste avant le lancement (tâche manuelle 7).
export const de: LegalContent = {
  updatedAt: "2026-11-23",
  pages: {
    legalNotice: {
      title: "Impressum",
      description:
        "Betreiber, inhaltlich Verantwortlicher und Hosting-Anbieter der Website {brandName}.",
      sections: [
        {
          title: "Betreiber der Website",
          paragraphs: [
            "Die Website {siteUrl} ({brandName}) wird betrieben von {companyName}, {legalForm}, eingetragen unter der Nummer {registration}, mit Sitz in {address}.",
            "Umsatzsteuer-Identifikationsnummer: {vatNumber}.",
            "Kontakt: {email}.",
          ],
        },
        {
          title: "Verantwortlich für den Inhalt",
          paragraphs: ["{publisher}."],
        },
        {
          title: "Hosting",
          paragraphs: [
            "Die Website wird von {hosting} gehostet.",
            "Die Kontodaten werden auf demselben Server in der Europäischen Union gespeichert.",
          ],
        },
        {
          title: "Geistiges Eigentum",
          paragraphs: [
            "Die Marke {brandName}, das Logo, die Illustrationen, die Texte und der Code der Website sind geschützt. Jede Vervielfältigung ohne schriftliche Genehmigung ist untersagt.",
            "Die von Ihnen eingegebenen Inhalte und die für Sie erstellten Lebensläufe gehören Ihnen.",
          ],
        },
      ],
    },
    terms: {
      title: "Allgemeine Geschäftsbedingungen",
      description:
        "Regeln für die Nutzung des Dienstes {brandName}, der KI-Credits, der Käufe und der Abonnements.",
      sections: [
        {
          title: "Gegenstand",
          paragraphs: [
            "Diese Bedingungen regeln die Nutzung des Dienstes {brandName}, der unter {siteUrl} erreichbar ist und von {companyName} betrieben wird. Sie gelten ab der Erstellung eines Kontos sowie für jeden Kauf.",
          ],
        },
        {
          title: "Der Dienst",
          paragraphs: [
            "Mit {brandName} erstellen Sie anhand von fünf Fragen mithilfe künstlicher Intelligenz einen Lebenslauf und verbessern anschließend Ihre Bewerbungen: Optimierung der Berufserfahrungen und des Kurzprofils, Anpassung an eine Stellenanzeige mit Analyse fehlender Schlüsselwörter, LinkedIn-Version, Anschreiben und Simulation eines Vorstellungsgesprächs.",
            "Die erste Erstellung eines Lebenslaufs ist kostenlos. Die übrigen Funktionen verbrauchen KI-Credits oder sind in einem Abonnement enthalten, wie auf der Preisseite angegeben.",
            "Die von der künstlichen Intelligenz erstellten Inhalte sind Vorschläge: Sie müssen sie vor der Verwendung überprüfen und korrigieren. Der Dienst garantiert weder ein Vorstellungsgespräch noch eine Anstellung.",
          ],
        },
        {
          title: "Konto",
          paragraphs: [
            "Für die Erstellung und Speicherung eines Lebenslaufs ist ein Konto erforderlich. Sie verpflichten sich, zutreffende Angaben zu machen und den Zugang zu Ihrer E-Mail-Adresse vertraulich zu halten.",
          ],
        },
        {
          title: "KI-Credits",
          paragraphs: [
            "Jeder KI-Vorgang verbraucht Credits: 1 Credit für die Erstellung eines Lebenslaufs, die Verbesserung einer Berufserfahrung, die Verbesserung eines Kurzprofils oder die Erstellung einer LinkedIn-Version; 2 Credits für die Anpassung eines Lebenslaufs an eine Stellenanzeige (einschließlich Schlüsselwortanalyse), die Erstellung eines Anschreibens oder die Simulation eines Vorstellungsgesprächs.",
            "Die in einem Abonnement enthaltenen Credits werden jeden Monat an dem Kalendertag, an dem das Abonnement abgeschlossen wurde, auf das Kontingent des Tarifs zurückgesetzt, auch bei einem Jahresabonnement; nicht genutzte enthaltene Credits werden nicht übertragen. Sie werden vor den gekauften Credits verbraucht.",
            "Gekaufte Credits (Credit-Pakete) und Credits, die Sie durch das Ansehen eines Werbevideos erhalten, bleiben verfügbar, solange das Konto besteht. Sie gehen bei der Löschung des Kontos verloren, unabhängig davon, ob Sie die Löschung beantragen oder ob sie nach drei Jahren Inaktivität erfolgt.",
            "Schlägt ein Vorgang fehl, werden die abgebuchten Credits automatisch wieder gutgeschrieben.",
          ],
        },
        {
          title: "Angebote und Preise",
          paragraphs: [
            "Die Preise werden vor jedem Kauf auf der Preisseite in Euro einschließlich aller Steuern angegeben.",
            "Credit-Pakete sind Einmalkäufe. „CV Pro“ schaltet für einen bestimmten Lebenslauf dauerhaft den PDF-Export ohne Wasserzeichen und den DOCX-Export frei; diese Freischaltung geht verloren, wenn dieser Lebenslauf durch eine neue Erstellung ersetzt wird. Sofern angeboten, ist das Entfernen der Werbung ein einmaliger und dauerhafter Kauf für das Konto.",
            "Die Tarife Essential, Pro und Premium werden monatlich oder jährlich angeboten. Die Funktionen und die Anzahl der monatlichen Credits jedes Tarifs sind auf der Preisseite beschrieben.",
          ],
        },
        {
          title: "Abonnements",
          paragraphs: [
            "Das Abonnement verlängert sich am Ende jedes Zeitraums (Monat oder Jahr) automatisch zum jeweils geltenden Preis; der Betrag wird über das bei unserem Zahlungsdienstleister Stripe hinterlegte Zahlungsmittel eingezogen.",
            "Sie können Ihr Abonnement jederzeit über „Mein Abo verwalten“ verwalten: Ein Wechsel in einen höheren Tarif gilt sofort und wird anteilig berechnet; ein Wechsel in einen niedrigeren Tarif sowie eine Kündigung werden zum Ende des bereits bezahlten Zeitraums wirksam.",
            "Schlägt eine Zahlung fehl, werden weitere Zahlungsversuche unternommen und Ihre Rechte bleiben währenddessen bestehen; kommt die Zahlung nicht zustande, endet das Abonnement.",
          ],
        },
        {
          title: "Kostenloser Testzeitraum",
          paragraphs: [
            "Ein kostenloser dreitägiger Testzeitraum für den Pro-Tarif wird nur einmal pro Konto angeboten. Dabei wird ein Zahlungsmittel abgefragt, während des Testzeitraums wird jedoch nichts abgebucht. Der Testzeitraum bietet Zugang zu den Pro-Funktionen mit 10 Credits.",
            "Wird nicht vor Ende des Testzeitraums gekündigt, beginnt das Abonnement und die erste Zahlung wird eingezogen; anschließend werden die 60 monatlichen Credits des Pro-Tarifs gutgeschrieben.",
          ],
        },
        {
          title: "Widerrufsrecht",
          paragraphs: [
            "Credits und CV Pro sind digitale Inhalte, die unmittelbar nach der Zahlung bereitgestellt werden. Indem Sie beim Kauf die sofortige Bereitstellung verlangen und bestätigen, dass Sie damit Ihr Widerrufsrecht verlieren, verzichten Sie auf dieses Recht.",
            "Bei einem Abonnement können Sie innerhalb von vierzehn Tagen ab Vertragsabschluss widerrufen, indem Sie an {email} schreiben. Haben Sie verlangt, dass die Leistung vor Ablauf dieser Frist beginnt, bleibt der Betrag für die bereits erbrachte Leistung geschuldet.",
          ],
        },
        {
          title: "Nutzung der Inhalte",
          paragraphs: [
            "Sie bleiben Eigentümer der von Ihnen eingegebenen Informationen und der für Sie erstellten Inhalte. Sie verpflichten sich, den Dienst nicht zur Erstellung falscher Angaben oder rechtswidriger Inhalte zu nutzen.",
          ],
        },
        {
          title: "Haftung",
          paragraphs: [
            "Wir setzen angemessene Mittel ein, um den Zugang zum Dienst und die Sicherheit Ihrer Daten zu gewährleisten, können jedoch keine ständige Verfügbarkeit garantieren. Für die Verwendung, die Sie von den erstellten Inhalten machen, übernehmen wir keine Haftung.",
          ],
        },
        {
          title: "Personenbezogene Daten",
          paragraphs: [
            "Die Verarbeitung Ihrer Daten wird in der Datenschutzerklärung beschrieben.",
          ],
        },
        {
          title: "Löschung des Kontos",
          paragraphs: [
            "Sie können Ihr Konto jederzeit in Ihrem persönlichen Bereich löschen. Die Löschung führt zur sofortigen Kündigung des laufenden Abonnements ohne Erstattung für den begonnenen Zeitraum sowie zum Verlust der Lebensläufe, der erstellten Inhalte und der Credits.",
            "Ein Konto ohne aktives Abonnement, das seit drei Jahren inaktiv ist, wird automatisch gelöscht; Sie werden dreißig Tage vorher per E-Mail benachrichtigt.",
          ],
        },
        {
          title: "Beschwerden, Schlichtung und anwendbares Recht",
          paragraphs: [
            "Bei Beschwerden wenden Sie sich bitte zunächst schriftlich an {email}. Wird keine Lösung gefunden, können Sie kostenlos die Verbraucherschlichtungsstelle anrufen: {mediator}.",
            "Diese Bedingungen unterliegen französischem Recht, ohne dass Ihnen dadurch der Schutz der zwingenden Vorschriften des Staates entzogen wird, in dem Sie Ihren gewöhnlichen Aufenthalt haben.",
          ],
        },
        {
          title: "Änderung der Bedingungen",
          paragraphs: [
            "Wir können diese Bedingungen ändern; Sie werden vor deren Inkrafttreten darüber informiert. Für ein laufendes Abonnement gelten die neuen Bedingungen ab der nächsten Verlängerung.",
          ],
        },
      ],
    },
    privacy: {
      title: "Datenschutzerklärung",
      description:
        "Von {brandName} verarbeitete personenbezogene Daten, Zwecke, Speicherdauer und Ihre Rechte.",
      sections: [
        {
          title: "Verantwortlicher",
          paragraphs: [
            "{companyName}, {address}. Kontakt für alle Fragen zu Ihren Daten: {email}.",
          ],
        },
        {
          title: "Verarbeitete Daten",
          paragraphs: [
            "Konto: E-Mail-Adresse, Vorname, Nachname sowie, sofern Sie diese angeben, Telefonnummer und Wohnort.",
            "Inhalte: Ihre Antworten auf die Fragen, Ihre Lebensläufe und die erstellten Inhalte (Anschreiben, LinkedIn-Versionen, Simulationen von Vorstellungsgesprächen).",
            "Nutzung: durchgeführte Vorgänge, Credits, Tarif und Käufe. Kartendaten werden ausschließlich von Stripe verarbeitet; wir speichern nur die Zahlungsreferenzen.",
            "Technische Daten: IP-Adresse in gehashter (unumkehrbar umgewandelter) Form zur Verhinderung von Missbrauch, technische Protokolle, Spracheinstellung, aus der IP-Adresse bei der ersten Anmeldung abgeleitetes Land (die Adresse selbst wird nicht gespeichert).",
          ],
        },
        {
          title: "Zwecke und Rechtsgrundlagen",
          paragraphs: [
            "Bereitstellung des Dienstes, Verwaltung Ihres Kontos, Ihrer Credits und Ihrer Abonnements: Vertragserfüllung.",
            "Rechnungsstellung und buchhalterische Pflichten: rechtliche Verpflichtung.",
            "Verhinderung von Missbrauch und Überwachung der Kosten des Dienstes: berechtigtes Interesse.",
            "Interne Besuchsstatistiken (verweisende Website oder Kampagne, Land), anonym, ohne Cookies und ohne Verbindung zu Ihrem Konto: berechtigtes Interesse.",
            "Personalisierte Werbung für Nutzer ohne Abonnement: Einwilligung, die Sie jederzeit widerrufen können.",
          ],
        },
        {
          title: "Speicherdauer",
          paragraphs: [
            "Die Kontodaten, die Lebensläufe und die erstellten Inhalte werden bis zur Löschung des Kontos bzw. bis zum Ablauf von drei Jahren Inaktivität gespeichert; Sie werden dreißig Tage vor der automatischen Löschung per E-Mail benachrichtigt.",
            "Die gehashte IP-Adresse wird nach dreißig Tagen gelöscht, technische Zahlungsereignisse nach neunzig Tagen. Rechnungen werden von Stripe für die gesetzlich vorgeschriebene Dauer aufbewahrt.",
            "Nach der Löschung eines Kontos werden nur Betrag und Datum der Zahlungen sowie die Kosten der Vorgänge ohne jeden Bezug zu Ihnen für Buchhaltung und Statistik aufbewahrt. Besuchsstatistiken werden fünfundzwanzig Monate aufbewahrt.",
            "Vor der Erstellung Ihres Kontos werden Ihre Antworten auf die fünf Fragen ausschließlich in Ihrem Browser gespeichert und gelöscht, sobald Ihr Lebenslauf gespeichert ist.",
          ],
        },
        {
          title: "Empfänger und Auftragsverarbeiter",
          paragraphs: [
            "Ihre Daten werden niemals verkauft. Sie werden in unserem Auftrag verarbeitet von: Hostinger (Hosting der Website und der Daten, Europäische Union), Anthropic (Verarbeitung der Texte durch künstliche Intelligenz, um die von Ihnen angeforderten Inhalte zu erstellen), Stripe (Zahlungen), Resend (E-Mail-Versand), Cloudflare (Schutz vor Bots bei der Anmeldung) sowie, ausschließlich nach Ihrer Einwilligung, Google (Werbung).",
          ],
        },
        {
          title: "Übermittlungen außerhalb der Europäischen Union",
          paragraphs: [
            "Einige Dienstleister können Daten außerhalb der Europäischen Union verarbeiten, insbesondere in den Vereinigten Staaten. Diese Übermittlungen sind durch geeignete Garantien abgesichert, etwa durch einen Angemessenheitsbeschluss der Europäischen Kommission oder deren Standardvertragsklauseln.",
          ],
        },
        {
          title: "Künstliche Intelligenz",
          paragraphs: [
            "Die für einen Vorgang erforderlichen Texte (Ihre Antworten, Ihr Lebenslauf, eine von Ihnen eingefügte Stellenanzeige) werden ausschließlich zur Erstellung des angeforderten Inhalts an unseren KI-Dienstleister übermittelt.",
          ],
        },
        {
          title: "Ihre Rechte",
          paragraphs: [
            "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch und Datenübertragbarkeit sowie das Recht, Ihre Einwilligung zu widerrufen. Sie können Ihr Konto selbst in Ihrem persönlichen Bereich löschen; für alle anderen Anliegen schreiben Sie an {email}.",
            "Sie können eine Beschwerde bei der CNIL (www.cnil.fr) oder bei der Datenschutzaufsichtsbehörde Ihres Landes einreichen.",
          ],
        },
        {
          title: "Sicherheit",
          paragraphs: [
            "Die Datenübertragung ist verschlüsselt (HTTPS), und jeder Nutzer hat nur Zugriff auf seine eigenen Daten; dies wird auf Ebene der Datenbank kontrolliert.",
          ],
        },
        {
          title: "Cookies",
          paragraphs: [
            "Die Verwendung von Cookies wird auf der eigens dafür vorgesehenen Cookie-Seite beschrieben.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie-Einstellungen",
      description:
        "Von {brandName} verwendete Cookies und die Verwaltung Ihrer Auswahl.",
      sections: [
        {
          title: "Was ist ein Cookie?",
          paragraphs: [
            "Ein Cookie ist eine kleine Datei, die in Ihrem Browser gespeichert wird. Damit können Sie zum Beispiel angemeldet bleiben oder eine Einstellung speichern.",
          ],
        },
        {
          title: "Unbedingt erforderliche Cookies",
          paragraphs: [
            "Diese Cookies sind für das Funktionieren der Website unerlässlich und erfordern keine Einwilligung: Anmeldesitzung für Ihr Konto, Speicherung der gewählten Sprache (höchstens ein Jahr), Sicherheit.",
          ],
        },
        {
          title: "Werbe-Cookies",
          paragraphs: [
            "Für Nutzer ohne Abonnement kann Google Werbung anzeigen. Werbe-Cookies werden nur mit Ihrer Einwilligung gesetzt, die über ein Banner eingeholt wird, in dem Sie ebenso einfach zustimmen wie ablehnen können. Für Abonnenten werden keine Werbe-Cookies verwendet.",
          ],
        },
        {
          title: "Ihre Auswahl verwalten",
          paragraphs: [
            "Sie können Ihre Auswahl jederzeit über den Link „Cookies verwalten“ am Ende jeder Seite ändern. Ihre Auswahl wird sechs Monate lang gespeichert. Sie können Cookies auch in den Einstellungen Ihres Browsers löschen.",
          ],
        },
      ],
    },
  },
};
