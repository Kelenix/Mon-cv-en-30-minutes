import type { LegalContent } from "../types";

// Traduction de fr.ts. À faire relire par un juriste avant le lancement (tâche manuelle 7).
export const it: LegalContent = {
  updatedAt: "2026-11-23",
  pages: {
    legalNotice: {
      title: "Note legali",
      description:
        "Editore, direttore della pubblicazione e fornitore di hosting del sito {brandName}.",
      sections: [
        {
          title: "Editore del sito",
          paragraphs: [
            "Il sito {siteUrl} ({brandName}) è edito da {companyName}, {legalForm}, iscritta con il numero {registration}, con sede legale in {address}.",
            "Numero di partita IVA intracomunitaria: {vatNumber}.",
            "Contatti: {email}.",
          ],
        },
        {
          title: "Direttore della pubblicazione",
          paragraphs: ["{publisher}."],
        },
        {
          title: "Hosting",
          paragraphs: [
            "Il sito è ospitato da {hosting}.",
            "I dati degli account sono conservati sullo stesso server, situato nell'Unione europea.",
          ],
        },
        {
          title: "Proprietà intellettuale",
          paragraphs: [
            "Il marchio {brandName}, il logo, le illustrazioni, i testi e il codice del sito sono protetti. È vietata qualsiasi riproduzione senza autorizzazione scritta.",
            "I contenuti da Lei inseriti e i CV generati per Lei Le appartengono.",
          ],
        },
      ],
    },
    terms: {
      title: "Condizioni generali di utilizzo e di vendita",
      description:
        "Regole di utilizzo del servizio {brandName}, dei crediti IA, degli acquisti e degli abbonamenti.",
      sections: [
        {
          title: "Oggetto",
          paragraphs: [
            "Le presenti condizioni disciplinano l'utilizzo del servizio {brandName}, accessibile su {siteUrl} e gestito da {companyName}. Si applicano dalla creazione di un account e a ogni acquisto.",
          ],
        },
        {
          title: "Il servizio",
          paragraphs: [
            "{brandName} consente di creare un CV con l'aiuto dell'intelligenza artificiale a partire da cinque domande e, successivamente, di migliorare le proprie candidature: miglioramento delle esperienze e del profilo professionale, adattamento a un'offerta di lavoro con analisi delle parole chiave mancanti, versione LinkedIn, lettera di presentazione e simulazione di colloquio.",
            "La prima generazione del CV è gratuita. Le altre funzioni utilizzano crediti IA o sono incluse in un piano di abbonamento, come indicato nella pagina Prezzi.",
            "I contenuti prodotti dall'intelligenza artificiale sono proposte: Lei deve rileggerli e correggerli prima di utilizzarli. Il servizio non garantisce l'ottenimento di un colloquio o di un impiego.",
          ],
        },
        {
          title: "Account",
          paragraphs: [
            "Per generare e salvare un CV è necessario un account. Lei si impegna a fornire informazioni esatte e a mantenere riservato l'accesso al Suo indirizzo e-mail.",
          ],
        },
        {
          title: "Crediti IA",
          paragraphs: [
            "Ogni operazione di intelligenza artificiale consuma crediti: 1 credito per generare un CV, migliorare un'esperienza, migliorare il profilo professionale o creare una versione LinkedIn; 2 crediti per adattare un CV a un'offerta di lavoro (analisi delle parole chiave inclusa), generare una lettera di presentazione o simulare un colloquio.",
            "I crediti inclusi in un abbonamento vengono ripristinati al livello previsto dal piano ogni mese, nel giorno corrispondente alla data di sottoscrizione, anche in caso di abbonamento annuale; i crediti inclusi non utilizzati non vengono riportati. Sono consumati prima dei crediti acquistati.",
            "I crediti acquistati (pacchetti di crediti) e quelli ottenuti guardando un video pubblicitario restano disponibili finché l'account esiste. Vanno persi in caso di cancellazione dell'account, sia che venga richiesta da Lei sia che avvenga dopo tre anni di inattività.",
            "Se un'operazione non va a buon fine, i crediti addebitati vengono riaccreditati automaticamente.",
          ],
        },
        {
          title: "Offerte e prezzi",
          paragraphs: [
            "I prezzi sono indicati comprensivi di tutte le imposte, in euro, nella pagina Prezzi, prima di qualsiasi acquisto.",
            "I pacchetti di crediti sono acquisti una tantum. Il «CV Pro» sblocca in via definitiva, per un determinato CV, l'esportazione in PDF senza filigrana e l'esportazione in DOCX; tale sblocco va perso se il CV viene sostituito da una nuova generazione. Quando è offerta, la rimozione della pubblicità è un acquisto una tantum e definitivo per l'account.",
            "I piani Essential, Pro e Premium sono disponibili con pagamento mensile o annuale. Le funzioni e il numero di crediti mensili di ciascun piano sono descritti nella pagina Prezzi.",
          ],
        },
        {
          title: "Abbonamenti",
          paragraphs: [
            "L'abbonamento si rinnova automaticamente alla fine di ogni periodo (mese o anno) al prezzo in vigore, mediante addebito sul metodo di pagamento registrato presso il nostro fornitore di servizi di pagamento Stripe.",
            "Può gestire il Suo abbonamento in qualsiasi momento da «Gestisci il mio abbonamento»: il passaggio a un piano superiore è immediato e fatturato pro rata; il passaggio a un piano inferiore e la disdetta hanno effetto alla fine del periodo già pagato.",
            "In caso di pagamento non riuscito, vengono effettuati ulteriori tentativi e i Suoi diritti restano attivi durante tale periodo; se il pagamento non va a buon fine, l'abbonamento cessa.",
          ],
        },
        {
          title: "Prova gratuita",
          paragraphs: [
            "Una prova gratuita di tre giorni del piano Pro è offerta una sola volta per account. Viene richiesto un metodo di pagamento, ma durante la prova non viene addebitato alcun importo. La prova dà accesso alle funzioni Pro con 10 crediti.",
            "In assenza di disdetta prima della fine della prova, l'abbonamento ha inizio e viene addebitato il primo pagamento; vengono quindi assegnati i 60 crediti mensili del piano Pro.",
          ],
        },
        {
          title: "Diritto di recesso",
          paragraphs: [
            "I crediti e il CV Pro sono contenuti digitali forniti immediatamente dopo il pagamento. Chiedendone la fornitura immediata e riconoscendo, al momento dell'acquisto, di perdere il diritto di recesso, Lei rinuncia a tale diritto.",
            "Per un abbonamento, Lei dispone di un termine di quattordici giorni dalla sottoscrizione per esercitare il diritto di recesso scrivendo a {email}. Se ha chiesto che il servizio inizi prima della scadenza di tale termine, resta dovuto l'importo corrispondente al servizio già fornito.",
          ],
        },
        {
          title: "Utilizzo dei contenuti",
          paragraphs: [
            "Lei resta titolare delle informazioni che inserisce e dei contenuti generati per Lei. Si impegna a non utilizzare il servizio per produrre informazioni false o contenuti illeciti.",
          ],
        },
        {
          title: "Responsabilità",
          paragraphs: [
            "Adottiamo mezzi ragionevoli per assicurare l'accesso al servizio e la sicurezza dei Suoi dati, senza poter garantire una disponibilità permanente. Non potremo essere ritenuti responsabili dell'uso che Lei fa dei contenuti generati.",
          ],
        },
        {
          title: "Dati personali",
          paragraphs: [
            "Il trattamento dei Suoi dati è descritto nell'informativa sulla privacy.",
          ],
        },
        {
          title: "Cancellazione dell'account",
          paragraphs: [
            "Può cancellare il Suo account in qualsiasi momento dalla Sua area personale. La cancellazione comporta la disdetta immediata dell'abbonamento in corso, senza rimborso del periodo già iniziato, nonché la perdita dei CV, dei contenuti generati e dei crediti.",
            "Un account senza abbonamento attivo e inattivo da tre anni viene cancellato automaticamente; riceverà un'e-mail di avviso trenta giorni prima.",
          ],
        },
        {
          title: "Reclami, mediazione e legge applicabile",
          paragraphs: [
            "Per qualsiasi reclamo, scriva innanzitutto a {email}. Se non viene trovata alcuna soluzione, può rivolgersi gratuitamente al mediatore dei consumatori: {mediator}.",
            "Le presenti condizioni sono disciplinate dalla legge francese, senza privarLa della protezione delle norme imperative del Paese in cui risiede.",
          ],
        },
        {
          title: "Modifica delle condizioni",
          paragraphs: [
            "Possiamo modificare le presenti condizioni; ne sarà informato prima della loro entrata in vigore. Per un abbonamento in corso, le nuove condizioni si applicano dal rinnovo successivo.",
          ],
        },
      ],
    },
    privacy: {
      title: "Informativa sulla privacy",
      description:
        "Dati personali trattati da {brandName}, finalità, tempi di conservazione e diritti.",
      sections: [
        {
          title: "Titolare del trattamento",
          paragraphs: [
            "{companyName}, {address}. Contatto per qualsiasi domanda sui Suoi dati: {email}.",
          ],
        },
        {
          title: "Dati trattati",
          paragraphs: [
            "Account: indirizzo e-mail, nome, cognome e, se li indica, telefono e città.",
            "Contenuti: le Sue risposte alle domande, i Suoi CV e i contenuti generati (lettere, versioni LinkedIn, simulazioni di colloquio).",
            "Utilizzo: operazioni effettuate, crediti, piano e acquisti. I dati della carta di pagamento sono trattati esclusivamente da Stripe; conserviamo solo i riferimenti dei pagamenti.",
            "Dati tecnici: indirizzo IP in forma di hash (trasformato in modo irreversibile) per prevenire gli abusi, log tecnici, preferenza di lingua.",
          ],
        },
        {
          title: "Finalità e basi giuridiche",
          paragraphs: [
            "Fornire il servizio, gestire il Suo account, i Suoi crediti e i Suoi abbonamenti: esecuzione del contratto.",
            "Fatturazione e obblighi contabili: obbligo di legge.",
            "Prevenzione degli abusi e monitoraggio dei costi del servizio: legittimo interesse.",
            "Pubblicità personalizzata per gli utenti senza abbonamento: consenso, che può revocare in qualsiasi momento.",
          ],
        },
        {
          title: "Tempi di conservazione",
          paragraphs: [
            "I dati dell'account, i CV e i contenuti generati sono conservati fino alla cancellazione dell'account, oppure per tre anni di inattività; un'e-mail La avvisa trenta giorni prima della cancellazione automatica.",
            "L'indirizzo IP sottoposto a hash viene cancellato dopo trenta giorni; gli eventi tecnici di pagamento dopo novanta giorni. Le fatture sono conservate da Stripe per la durata prevista dalla legge.",
            "Prima della creazione del Suo account, le Sue risposte alle cinque domande sono salvate esclusivamente nel Suo browser e vengono cancellate non appena il Suo CV viene salvato.",
          ],
        },
        {
          title: "Destinatari e responsabili del trattamento",
          paragraphs: [
            "I Suoi dati non vengono mai venduti. Sono trattati, per nostro conto, da: Hostinger (hosting del sito e dei dati, Unione europea), Anthropic (elaborazione dei testi tramite intelligenza artificiale per produrre i contenuti da Lei richiesti), Stripe (pagamenti), Resend (invio delle e-mail) e, solo previo Suo consenso, Google (pubblicità).",
          ],
        },
        {
          title: "Trasferimenti al di fuori dell'Unione europea",
          paragraphs: [
            "Alcuni fornitori possono trattare dati al di fuori dell'Unione europea, in particolare negli Stati Uniti. Tali trasferimenti sono soggetti a garanzie adeguate, come una decisione di adeguatezza della Commissione europea o le clausole contrattuali tipo da essa adottate.",
          ],
        },
        {
          title: "Intelligenza artificiale",
          paragraphs: [
            "I testi necessari a un'operazione (le Sue risposte, il Suo CV, un annuncio che incolla) sono trasmessi al nostro fornitore di intelligenza artificiale unicamente per produrre il contenuto richiesto.",
          ],
        },
        {
          title: "I Suoi diritti",
          paragraphs: [
            "Lei dispone dei diritti di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità, nonché del diritto di revocare il Suo consenso. Può cancellare autonomamente il Suo account dalla Sua area personale; per le altre richieste, scriva a {email}.",
            "Può proporre reclamo alla CNIL (www.cnil.fr) o all'autorità di controllo per la protezione dei dati del Suo Paese (in Italia, il Garante per la protezione dei dati personali).",
          ],
        },
        {
          title: "Sicurezza",
          paragraphs: [
            "Le comunicazioni sono cifrate (HTTPS) e ogni utente accede soltanto ai propri dati, con un controllo effettuato a livello di database.",
          ],
        },
        {
          title: "Cookie",
          paragraphs: [
            "L'utilizzo dei cookie è descritto nella pagina dedicata ai cookie.",
          ],
        },
      ],
    },
    cookies: {
      title: "Gestione dei cookie",
      description:
        "Cookie utilizzati da {brandName} e gestione delle Sue scelte.",
      sections: [
        {
          title: "Che cos'è un cookie?",
          paragraphs: [
            "Un cookie è un piccolo file salvato nel Suo browser. Consente ad esempio di restare connessi o di ricordare una preferenza.",
          ],
        },
        {
          title: "Cookie strettamente necessari",
          paragraphs: [
            "Questi cookie sono indispensabili al funzionamento del sito e non richiedono il consenso: sessione di accesso al Suo account, memorizzazione della lingua scelta (per un massimo di un anno), sicurezza.",
          ],
        },
        {
          title: "Cookie pubblicitari",
          paragraphs: [
            "Per gli utenti senza abbonamento, possono essere mostrati annunci pubblicitari da Google. I cookie pubblicitari vengono installati solo con il Suo consenso, raccolto tramite un banner che consente di accettare o rifiutare con la stessa facilità. Nessun cookie pubblicitario viene utilizzato per gli abbonati.",
          ],
        },
        {
          title: "Gestire le Sue scelte",
          paragraphs: [
            "Può modificare la Sua scelta in qualsiasi momento tramite il link «Gestisci i cookie» in fondo a ogni pagina. La Sua scelta viene conservata per sei mesi. Può anche eliminare i cookie dalle impostazioni del Suo browser.",
          ],
        },
      ],
    },
  },
};
