import type { SentenzaRisultato } from "../types";

// ============================================================
// PUNTO DI AGGANCIO — DATABASE SENTENZE ESTERNO (Lisia)
// ------------------------------------------------------------
// DB ESTERNO (6.5M+ sentenze reali) interrogato via la nostra
// route server `/api/sentenze` (che tiene la chiave segreta e
// chiama aiapi.lisia.it con header `Authorization: ApiKey ...`).
// Modalità reale attiva quando NEXT_PUBLIC_SENTENZE_COLLEGATO="true"
// e la chiave è impostata lato server; altrimenti modalità simulata.
// ============================================================

export const SENTENZE_COLLEGATO =
  process.env.NEXT_PUBLIC_SENTENZE_COLLEGATO === "true";

export interface FiltriSentenze {
  materia?: string;
  soloMassime?: boolean;
}

export interface MetadatiSentenze {
  number?: string | number;
  year?: string | number;
  place?: string;
  region?: string;
  issuer?: string;
  area?: string;
  section?: string;
  date_from?: string;
  date_to?: string;
}

/** Chiamata alla route server di ricerca sentenze. */
async function chiamaRoute(body: unknown): Promise<SentenzaRisultato[]> {
  const res = await fetch("/api/sentenze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Errore ricerca (${res.status})`);
  }
  const j = await res.json();
  return (j.risultati ?? []) as SentenzaRisultato[];
}

/** Ricerca per estremi (numero, anno, sede, organo...). Solo modalità reale. */
export async function cercaSentenzePerEstremi(
  metadati: MetadatiSentenze,
): Promise<SentenzaRisultato[]> {
  if (!SENTENZE_COLLEGATO) return [];
  return chiamaRoute({ mode: "metadata", metadati, size: 20 });
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
 * Ricerca a testo libero nel database sentenze (modalità content).
 * Reale via `/api/sentenze` se collegato; altrimenti simulata sul POOL.
 */
export async function cercaSentenze(
  query: string,
  filtri: FiltriSentenze = {},
): Promise<SentenzaRisultato[]> {
  if (SENTENZE_COLLEGATO) {
    let risultati = await chiamaRoute({ mode: "content", query, size: 10 });
    if (filtri.materia) {
      risultati = risultati.filter(
        (s) => s.materia.toLowerCase() === filtri.materia!.toLowerCase(),
      );
    }
    return risultati;
  }

  // --- Simulato ---
  await new Promise((r) => setTimeout(r, 650));
  let risultati = POOL.map((s) => ({ ...s, rilevanza: scorePerQuery(query, s) }));
  if (filtri.materia) {
    risultati = risultati.filter(
      (s) => s.materia.toLowerCase() === filtri.materia!.toLowerCase(),
    );
  }
  return risultati.sort((a, b) => b.rilevanza - a.rilevanza);
}
