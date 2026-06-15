import type { SentenzaRisultato } from "../types";

// ============================================================
// PUNTO DI AGGANCIO — DATABASE SENTENZE ESTERNO
// ------------------------------------------------------------
// Questo è il database ESTERNO (6.5M+ sentenze reali, aggiornato
// ogni 24h) di proprietà di LisiaNext. NON è il nostro DB
// gestionale. Verrà collegato dal vecchio sviluppatore.
//
// Per collegarlo davvero basterà sostituire il corpo di
// `cercaSentenze` con una fetch all'endpoint reale, es:
//
//   const res = await fetch(`${process.env.SENTENZE_API_URL}/search`, {
//     method: "POST",
//     headers: { Authorization: `Bearer ${process.env.SENTENZE_API_KEY}` },
//     body: JSON.stringify({ query, filtri }),
//   });
//   return (await res.json()).risultati;
//
// La firma della funzione resta invariata, così il resto della
// piattaforma (ricerche, gestionale, AI) non va toccato.
// ============================================================

export const SENTENZE_COLLEGATO = false; // diventerà true quando l'API reale è attiva

export interface FiltriSentenze {
  materia?: string;
  soloMassime?: boolean;
}

const POOL: SentenzaRisultato[] = [
  {
    id: "s-16632-2026",
    estremi: "Cass. civ. Sez. III, n. 16632/2026",
    data: "2026-05-27",
    materia: "Locazioni",
    massima:
      "In tema di sfratto per morosità, la convalida presuppone la prova del mancato pagamento dei canoni alla data dell'intimazione; l'opposizione del conduttore deve fondarsi su fatti specifici e documentati.",
    rilevanza: 0.96,
    fonte: "Corte di Cassazione",
  },
  {
    id: "s-10941-2026",
    estremi: "Cass. civ. Sez. VI, n. 10941/2026",
    data: "2026-04-14",
    materia: "Tributario",
    massima:
      "La cartella di pagamento è nulla quando la notifica non si è perfezionata nelle forme di legge; il vizio è deducibile con opposizione agli atti esecutivi nei termini di rito.",
    rilevanza: 0.91,
    fonte: "Corte di Cassazione",
  },
  {
    id: "s-8820-2026",
    estremi: "Trib. Milano Sez. Impresa, n. 8820/2026",
    data: "2026-03-30",
    materia: "Commerciale",
    massima:
      "Nel giudizio di opposizione a decreto ingiuntivo, la provvisoria esecutorietà non viene meno per la sola proposizione dell'opposizione, occorrendo gravi motivi ex art. 649 c.p.c.",
    rilevanza: 0.88,
    fonte: "Tribunale di Milano",
  },
  {
    id: "s-7715-2026",
    estremi: "Cass. civ. Sez. I, n. 7715/2026",
    data: "2026-03-02",
    materia: "Famiglia",
    massima:
      "L'affidamento condiviso costituisce la regola; il collocamento prevalente presso un genitore deve rispondere in concreto all'interesse del minore.",
    rilevanza: 0.84,
    fonte: "Corte di Cassazione",
  },
  {
    id: "s-5402-2026",
    estremi: "Cass. civ. Sez. II, n. 5402/2026",
    data: "2026-02-11",
    materia: "Condominio",
    massima:
      "La clausola del regolamento condominiale di natura contrattuale può derogare ai criteri legali di uso delle parti comuni purché non incida su diritti individuali indisponibili.",
    rilevanza: 0.79,
    fonte: "Corte di Cassazione",
  },
];

function scorePerQuery(query: string, s: SentenzaRisultato): number {
  const q = query.toLowerCase();
  const testo = `${s.estremi} ${s.materia} ${s.massima}`.toLowerCase();
  const parole = q.split(/\s+/).filter((w) => w.length > 3);
  if (parole.length === 0) return s.rilevanza;
  const hit = parole.filter((w) => testo.includes(w)).length / parole.length;
  return Math.min(0.99, 0.4 * s.rilevanza + 0.6 * hit + s.rilevanza * 0.1);
}

export function getSentenzaById(id: string): SentenzaRisultato | undefined {
  return POOL.find((s) => s.id === id);
}

/**
 * Ricerca nel database sentenze.
 * (STUB simulato — vedi nota in cima al file per il collegamento reale.)
 */
export async function cercaSentenze(
  query: string,
  filtri: FiltriSentenze = {},
): Promise<SentenzaRisultato[]> {
  await new Promise((r) => setTimeout(r, 650));
  let risultati = POOL.map((s) => ({ ...s, rilevanza: scorePerQuery(query, s) }));
  if (filtri.materia) {
    risultati = risultati.filter(
      (s) => s.materia.toLowerCase() === filtri.materia!.toLowerCase(),
    );
  }
  return risultati.sort((a, b) => b.rilevanza - a.rilevanza);
}
