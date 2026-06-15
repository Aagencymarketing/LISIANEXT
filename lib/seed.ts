import type { Cliente, ConversazioneAI, VoceCronologia } from "./types";

// Dati dimostrativi (DB gestionale locale). In produzione verranno
// sostituiti dal database reale dello studio.

export const CLIENTI_SEED: Cliente[] = [
  {
    id: "cli-paolo-rossi",
    tipo: "persona",
    nome: "Paolo",
    cognome: "Rossi",
    email: "paolo.rossi@email.it",
    telefono: "+39 348 1122334",
    codiceFiscale: "RSSPLA75M01H501Z",
    indirizzo: "Via Garibaldi 14",
    citta: "Roma",
    tags: ["Locazioni", "Cliente storico"],
    note: "Cliente seguito dal 2019. Preferisce comunicazioni via email.",
    createdAt: "2026-04-02T09:00:00.000Z",
    cause: [
      {
        id: "cau-rossi-1",
        oggetto: "Sfratto per morosità conduttore immobile Via Appia",
        materia: "civile",
        controparte: "Verdi Costruzioni S.r.l.",
        foro: "Tribunale di Roma",
        numeroRuolo: "R.G. 4821/2026",
        stato: "in_corso",
        valore: 28000,
        prossimaUdienza: "2026-07-09T09:30:00.000Z",
        note: "Morosità accertata di 7 mensilità. In attesa convalida.",
        createdAt: "2026-04-05T10:00:00.000Z",
      },
      {
        id: "cau-rossi-2",
        oggetto: "Opposizione a cartella di pagamento Agenzia Entrate",
        materia: "tributario",
        controparte: "Agenzia delle Entrate-Riscossione",
        foro: "Corte di Giustizia Tributaria di Roma",
        numeroRuolo: "R.G.T. 1190/2026",
        stato: "aperta",
        valore: 12400,
        note: "Vizio di notifica della cartella. Da valutare prescrizione.",
        createdAt: "2026-05-18T10:00:00.000Z",
      },
    ],
    attivita: [
      {
        id: "att-rossi-1",
        causaId: "cau-rossi-1",
        data: "2026-04-05T10:00:00.000Z",
        tipo: "incarico",
        titolo: "Conferimento incarico",
        descrizione: "Sottoscritto mandato per procedura di sfratto per morosità.",
      },
      {
        id: "att-rossi-2",
        causaId: "cau-rossi-1",
        data: "2026-04-20T11:00:00.000Z",
        tipo: "atto",
        titolo: "Notificata intimazione di sfratto e citazione",
        descrizione: "Notifica a mezzo UNEP perfezionata il 22/04.",
      },
      {
        id: "att-rossi-3",
        causaId: "cau-rossi-1",
        data: "2026-07-09T09:30:00.000Z",
        tipo: "udienza",
        titolo: "Udienza di convalida",
        descrizione: "Prima udienza per convalida di sfratto.",
      },
      {
        id: "att-rossi-4",
        causaId: "cau-rossi-2",
        data: "2026-05-18T09:00:00.000Z",
        tipo: "nota",
        titolo: "Esame cartella e calcolo termini",
        descrizione: "Cartella notificata il 12/05. Ricorso entro 60 gg.",
      },
    ],
    documenti: [
      {
        id: "doc-rossi-1",
        nome: "Mandato_Rossi",
        estensione: "pdf",
        causaId: "cau-rossi-1",
        createdAt: "2026-04-05T10:00:00.000Z",
      },
      {
        id: "doc-rossi-2",
        nome: "Contratto_locazione_ViaAppia",
        estensione: "pdf",
        causaId: "cau-rossi-1",
        createdAt: "2026-04-06T10:00:00.000Z",
      },
      {
        id: "doc-rossi-3",
        nome: "Cartella_AE_2026",
        estensione: "pdf",
        causaId: "cau-rossi-2",
        createdAt: "2026-05-18T10:00:00.000Z",
      },
    ],
  },
  {
    id: "cli-bianchi-srl",
    tipo: "azienda",
    ragioneSociale: "Bianchi Logistica S.r.l.",
    email: "amministrazione@bianchilogistica.it",
    telefono: "+39 02 7788991",
    partitaIva: "IT09876543210",
    indirizzo: "Viale dell'Industria 8",
    citta: "Milano",
    tags: ["Recupero crediti", "Societario"],
    note: "Studio di riferimento per il recupero crediti commerciali.",
    createdAt: "2026-03-10T09:00:00.000Z",
    cause: [
      {
        id: "cau-bianchi-1",
        oggetto: "Decreto ingiuntivo c/ Trasporti Sud S.p.A.",
        materia: "commerciale",
        controparte: "Trasporti Sud S.p.A.",
        foro: "Tribunale di Milano",
        numeroRuolo: "R.G. 9920/2026",
        stato: "in_corso",
        valore: 54200,
        prossimaUdienza: "2026-06-25T10:00:00.000Z",
        note: "Fatture insolute 2025. Opposizione proposta dalla controparte.",
        createdAt: "2026-03-15T10:00:00.000Z",
      },
    ],
    attivita: [
      {
        id: "att-bianchi-1",
        causaId: "cau-bianchi-1",
        data: "2026-03-15T10:00:00.000Z",
        tipo: "atto",
        titolo: "Deposito ricorso per decreto ingiuntivo",
        descrizione: "Decreto ottenuto e dichiarato provvisoriamente esecutivo.",
      },
      {
        id: "att-bianchi-2",
        causaId: "cau-bianchi-1",
        data: "2026-05-02T10:00:00.000Z",
        tipo: "comunicazione",
        titolo: "Notificata opposizione dalla controparte",
        descrizione: "Costituzione in giudizio di opposizione entro i termini.",
      },
    ],
    documenti: [
      {
        id: "doc-bianchi-1",
        nome: "Fatture_insolute_2025",
        estensione: "pdf",
        causaId: "cau-bianchi-1",
        createdAt: "2026-03-12T10:00:00.000Z",
      },
    ],
  },
  {
    id: "cli-laura-conti",
    tipo: "persona",
    nome: "Laura",
    cognome: "Conti",
    email: "laura.conti@email.it",
    telefono: "+39 333 4455667",
    codiceFiscale: "CNTLRA88T45F205X",
    indirizzo: "Corso Vittorio 22",
    citta: "Torino",
    tags: ["Famiglia"],
    note: "Separazione consensuale, presenza di figli minori.",
    createdAt: "2026-05-01T09:00:00.000Z",
    cause: [
      {
        id: "cau-conti-1",
        oggetto: "Separazione consensuale con affidamento condiviso",
        materia: "famiglia",
        controparte: "Marco Ferrari (coniuge)",
        foro: "Tribunale di Torino",
        stato: "aperta",
        note: "Accordo su assegno e collocamento prevalente da definire.",
        createdAt: "2026-05-04T10:00:00.000Z",
      },
    ],
    attivita: [
      {
        id: "att-conti-1",
        causaId: "cau-conti-1",
        data: "2026-05-04T10:00:00.000Z",
        tipo: "incarico",
        titolo: "Primo colloquio e conferimento incarico",
        descrizione: "Raccolta documentazione reddituale e patrimoniale.",
      },
    ],
    documenti: [],
  },
];

export const CRONOLOGIA_SEED: VoceCronologia[] = [
  {
    id: "cr-1",
    testo:
      "La clausola risolutiva di un contratto rientra tra quelle vessatorie di cui all'art. 1341 c.c.?",
    tipo: "Sentenze",
    occorrenze: 19,
    createdAt: "2026-06-10T17:05:00.000Z",
  },
  {
    id: "cr-2",
    testo:
      "La clausola risolutiva di un contratto rientra tra quelle vessatorie di cui all'art. 1341 c.c.?",
    tipo: "Massime",
    occorrenze: 4,
    createdAt: "2026-06-10T17:05:00.000Z",
  },
  {
    id: "cr-3",
    testo:
      "Sono ammissibili i documenti depositati dalla curatela nel giudizio di opposizione alla sentenza dichiarativa della liquidazione giudiziale, oltre il termine di rito?",
    tipo: "Sentenze",
    occorrenze: 2,
    createdAt: "2026-06-04T23:30:00.000Z",
  },
  {
    id: "cr-4",
    testo:
      "È valido un regolamento di condominio che prevede che i condomini siano privilegiati rispetto ai conduttori nell'uso dei posti auto da assegnarsi a rotazione?",
    tipo: "Sentenze",
    createdAt: "2026-05-22T10:02:00.000Z",
  },
  {
    id: "cr-5",
    testo:
      "È legittimato a impugnare le delibere condominiali l'utilizzatore di un immobile in leasing?",
    tipo: "Sentenze",
    occorrenze: 3,
    createdAt: "2026-05-21T17:34:00.000Z",
  },
];

export const CONVERSAZIONI_SEED: ConversazioneAI[] = [];
