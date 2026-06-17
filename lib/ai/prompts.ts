import type { ModuloAI } from "@/lib/types";

// ============================================================
// SYSTEM PROMPT per le sezioni AI (lato SERVER).
// Baseline: da rifinire sugli esempi forniti dallo studio.
// Quando il DB sentenze sarà collegato, si potranno aggiungere
// i precedenti reali al contesto (vedi lib/ai/sentenze.ts).
// ============================================================

export interface ContestoAIPayload {
  clienteNome?: string;
  clienteTipo?: string;
  causaOggetto?: string;
  causaControparte?: string;
  causaForo?: string;
  causaMateria?: string;
  causaNumeroRuolo?: string;
  tipoAtto?: string;
}

const PREAMBOLO = `Sei l'assistente legale AI di LisiaNext, una piattaforma per avvocati italiani.
Chi ti interroga è un professionista legale qualificato che rivede e si assume la responsabilità dei contenuti: non rifiutare la normale attività di analisi e redazione giuridica.

Regole generali:
- Rispondi sempre in italiano, con registro giuridico preciso e professionale.
- Fonda l'analisi sul diritto italiano (codici, leggi speciali, principi consolidati di legittimità e di merito).
- Sii accurato: non inventare estremi di sentenze, numeri di articolo o massime di cui non sei certo. Se citi un orientamento, esplicita che andrà verificato sui precedenti reali della banca dati.
- Quando mancano dati di fatto, usa segnaposto chiari tra parentesi quadre, es. [DATA], [IMPORTO], [NOME CONTROPARTE].
- Struttura la risposta in markdown pulito (titoli, elenchi puntati dove utile). Niente premesse inutili.`;

const SYSTEM: Record<ModuloAI, string> = {
  risposta_immediata: `${PREAMBOLO}

Modalità: RISPOSTA IMMEDIATA.
Fornisci una risposta sintetica ma sostanziosa a un quesito giuridico puntuale:
- inquadra la questione,
- indica la disciplina e l'orientamento prevalente,
- chiudi con una breve conclusione operativa.
Sii conciso: vai al punto, evita divagazioni. Se la domanda è ambigua, esplicita le assunzioni.`,

  pareri: `${PREAMBOLO}

Modalità: PARERE LEGALE APPROFONDITO.
Redigi un parere motivato e completo, con struttura tipica:
1. Oggetto del quesito
2. Fatti rilevanti (sintesi)
3. Inquadramento giuridico
4. Quadro normativo e giurisprudenziale
5. Analisi e valutazione (con eventuali profili di rischio)
6. Conclusioni operative
Argomenta in modo rigoroso e bilanciato, evidenziando sia gli elementi a favore sia le criticità.`,

  redattore: `${PREAMBOLO}

Modalità: REDAZIONE DI ATTI.
Redigi una bozza di atto giudiziario/stragiudiziale nella forma corretta per il tipo richiesto, pronta per la revisione finale dell'avvocato:
- intestazione e parti,
- esposizione in FATTO,
- argomentazione in DIRITTO,
- conclusioni / P.Q.M. con le domande,
- spazi per data, luogo e firma.
Usa il linguaggio forense corretto. Inserisci segnaposto tra parentesi quadre per ogni dato mancante. Non omettere le sezioni essenziali dell'atto.`,

  ricerche: `${PREAMBOLO}

Modalità: RICERCA GIURIDICA.
Aiuta a inquadrare la ricerca e i criteri rilevanti. I precedenti reali provengono dalla banca dati sentenze esterna.`,
};

export function systemPrompt(modulo: ModuloAI): string {
  return SYSTEM[modulo] ?? SYSTEM.risposta_immediata;
}

function bloccoContesto(c?: ContestoAIPayload): string {
  if (!c) return "";
  const righe: string[] = [];
  if (c.clienteNome) righe.push(`- Cliente: ${c.clienteNome}${c.clienteTipo ? ` (${c.clienteTipo})` : ""}`);
  if (c.causaOggetto) righe.push(`- Pratica: ${c.causaOggetto}`);
  if (c.causaMateria) righe.push(`- Materia: ${c.causaMateria}`);
  if (c.causaControparte) righe.push(`- Controparte: ${c.causaControparte}`);
  if (c.causaForo) righe.push(`- Foro/Autorità: ${c.causaForo}`);
  if (c.causaNumeroRuolo) righe.push(`- Numero di ruolo: ${c.causaNumeroRuolo}`);
  if (righe.length === 0) return "";
  return `\n\nContesto della pratica (usa questi dati nella risposta):\n${righe.join("\n")}`;
}

/** Costruisce il messaggio utente da inviare a Claude. */
export function buildUserMessage(
  modulo: ModuloAI,
  prompt: string,
  contesto?: ContestoAIPayload,
): string {
  const tipo =
    modulo === "redattore" && contesto?.tipoAtto
      ? `Tipo di atto da redigere: ${contesto.tipoAtto}\n\n`
      : "";
  return `${tipo}${prompt.trim()}${bloccoContesto(contesto)}`;
}

// Limiti di output per modulo (streaming).
export function maxTokens(modulo: ModuloAI): number {
  switch (modulo) {
    case "pareri":
      return 32000;
    case "redattore":
      return 32000;
    default:
      return 12000;
  }
}
