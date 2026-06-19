// ============================================================
// Modello dati LisiaNext
// ------------------------------------------------------------
// NB: due database distinti (concettualmente):
//  1) DB GESTIONALE (questo) -> clienti, cause, storico. Per la
//     demo vive in locale (localStorage via zustand).
//  2) DB SENTENZE (esterno, 6.5M+, agg. 24h) -> collegato in
//     seguito dal vecchio sviluppatore. Qui solo i punti di
//     aggancio (vedi lib/ai/sentenze.ts).
// ============================================================

export type TipoCliente = "persona" | "azienda";

export type StatoCausa =
  | "aperta"
  | "in_corso"
  | "sospesa"
  | "chiusa_vinta"
  | "chiusa_persa"
  | "archiviata";

export type MateriaCausa =
  | "civile"
  | "penale"
  | "lavoro"
  | "famiglia"
  | "tributario"
  | "amministrativo"
  | "commerciale"
  | "altro";

export type TipoAttivita =
  | "nota"
  | "udienza"
  | "deposito"
  | "comunicazione"
  | "atto"
  | "incarico"
  | "scadenza"
  | "pagamento";

export interface Attivita {
  id: string;
  causaId?: string;
  data: string; // ISO
  tipo: TipoAttivita;
  titolo: string;
  descrizione?: string;
}

export interface Documento {
  id: string;
  nome: string;
  estensione: string; // pdf, docx, txt
  causaId?: string;
  storagePath?: string; // percorso nel bucket Supabase Storage
  createdAt: string;
}

export interface Causa {
  id: string;
  oggetto: string;
  materia: MateriaCausa;
  controparte?: string;
  foro?: string; // Tribunale / Corte
  numeroRuolo?: string;
  stato: StatoCausa;
  valore?: number; // valore della causa in euro
  prossimaUdienza?: string; // ISO date
  note?: string;
  createdAt: string;
}

export interface Cliente {
  id: string;
  tipo: TipoCliente;
  // persona
  nome?: string;
  cognome?: string;
  // azienda
  ragioneSociale?: string;
  // comuni
  email?: string;
  telefono?: string;
  codiceFiscale?: string;
  partitaIva?: string;
  indirizzo?: string;
  citta?: string;
  note?: string;
  tags?: string[];
  createdAt: string;
  cause: Causa[];
  attivita: Attivita[];
  documenti: Documento[];
}

// --- AI / cronologia ---

export type ModuloAI = "risposta_immediata" | "pareri" | "redattore" | "ricerche";

export interface MessaggioChat {
  id: string;
  ruolo: "utente" | "assistente";
  contenuto: string;
  createdAt: string;
}

export interface ConversazioneAI {
  id: string;
  modulo: ModuloAI;
  titolo: string;
  messaggi: MessaggioChat[];
  clienteId?: string;
  causaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoceCronologia {
  id: string;
  testo: string;
  tipo: "Sentenze" | "Massime" | "Parere" | "Atto" | "Chat";
  occorrenze?: number;
  createdAt: string;
}

export interface SentenzaRisultato {
  id: string;
  estremi: string; // es. "Cass. civ. Sez. III, n. 16632/2026"
  data: string;
  materia: string;
  massima: string;
  rilevanza: number; // 0..1 (relativo, da `score` in modalità content; 0 in metadata)
  fonte: string;
  // --- campi dal DB sentenze reale (opzionali, retro-compatibili) ---
  rulingId?: string; // id univoco della sentenza (document.ruling_id) per dedup/preferiti
  testoCompleto?: string; // sentenza integrale (document.ruling_full_text)
  tipo?: string; // sentenza | ordinanza | decreto (ruling_item_type)
}

// Helper di visualizzazione
export function nomeCliente(c: Cliente): string {
  if (c.tipo === "azienda") return c.ragioneSociale || "Azienda senza nome";
  return [c.nome, c.cognome].filter(Boolean).join(" ") || "Cliente senza nome";
}

export function inizialiCliente(c: Cliente): string {
  if (c.tipo === "azienda") {
    return (c.ragioneSociale || "AZ").trim().slice(0, 2).toUpperCase();
  }
  return `${(c.nome || "?")[0] || "?"}${(c.cognome || "")[0] || ""}`.toUpperCase();
}
