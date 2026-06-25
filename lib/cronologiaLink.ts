import type { VoceCronologia } from "@/lib/types";

/**
 * Destinazione corretta per una voce di cronologia.
 * Se la voce è collegata a un lavoro salvato (parere/atto/risposta), apre la
 * SUA sezione con il lavoro intero (`?apri=<convId>`); altrimenti (ricerche di
 * sentenze) rimanda alla ricerca legale con la query completa.
 */
const SEZIONE_MODULO: Record<string, string> = {
  pareri: "/ai/pareri",
  redattore: "/ai/redattore",
  risposta_immediata: "/ai/risposta-immediata",
};

// Sezione corretta in base al TIPO della voce (per le voci che non hanno il
// collegamento al lavoro salvato, es. quelle vecchie create prima del fix).
const SEZIONE_TIPO: Record<VoceCronologia["tipo"], string> = {
  Parere: "/ai/pareri",
  Atto: "/ai/redattore",
  Chat: "/ai/risposta-immediata",
  Sentenze: "/ricerche",
  Massime: "/ricerche",
};

export function linkVoceCronologia(v: VoceCronologia): string {
  // 1) Collegata a un lavoro salvato → apri proprio quel lavoro.
  if (v.convId && v.modulo) {
    const base = SEZIONE_MODULO[v.modulo];
    if (base) return `${base}?apri=${encodeURIComponent(v.convId)}`;
  }
  // 2) Altrimenti instrada alla sezione giusta in base al tipo.
  //    Un Parere apre i Pareri, un Atto il Redattore, una Chat le Risposte
  //    interattive; ricerche/massime vanno su Ricerche legali con la query.
  if (v.tipo === "Sentenze" || v.tipo === "Massime") {
    return `/ricerche?q=${encodeURIComponent(v.testo)}`;
  }
  return SEZIONE_TIPO[v.tipo] ?? `/ricerche?q=${encodeURIComponent(v.testo)}`;
}
