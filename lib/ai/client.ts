"use client";

import type { ModuloAI } from "@/lib/types";
import { nomeCliente } from "@/lib/types";
import { MATERIA_CAUSA } from "@/lib/labels";
import { formatEuro, formatData } from "@/lib/utils";
import { generaRisposta, streamRisposta, type ContestoAI } from "@/lib/ai/mock";
import type { ContestoAIPayload, VarianteParere } from "@/lib/ai/prompts";

export type { VarianteParere };

// Flag: AI reale collegata quando la variabile pubblica vale "true".
// In assenza (demo, nessuna chiave), si usa il motore simulato.
export const AI_COLLEGATO =
  process.env.NEXT_PUBLIC_AI_COLLEGATO === "true";

/** Mappa il contesto ricco (oggetti Cliente/Causa) nel payload serializzabile per l'API. */
function toPayload(ctx?: ContestoAI): ContestoAIPayload | undefined {
  if (!ctx) return undefined;
  const p: ContestoAIPayload = {};
  if (ctx.cliente) {
    const cl = ctx.cliente;
    p.clienteNome = nomeCliente(cl);
    p.clienteTipo = cl.tipo === "azienda" ? "azienda" : "persona fisica";
    p.clienteEmail = cl.email || undefined;
    p.clienteIndirizzo = cl.indirizzo || undefined;
    p.clienteCitta = cl.citta || undefined;
    p.clienteCodiceFiscale = cl.codiceFiscale || undefined;
    p.clientePartitaIva = cl.partitaIva || undefined;
    p.clienteNote = cl.note || undefined;
  }
  if (ctx.causa) {
    const ca = ctx.causa;
    p.causaOggetto = ca.oggetto;
    p.causaMateria = ca.materia ? MATERIA_CAUSA[ca.materia] : undefined;
    p.causaControparte = ca.controparte || undefined;
    p.causaForo = ca.foro || undefined;
    p.causaNumeroRuolo = ca.numeroRuolo || undefined;
    p.causaValore = ca.valore != null ? formatEuro(ca.valore) : undefined;
    p.causaProssimaUdienza = ca.prossimaUdienza ? formatData(ca.prossimaUdienza) : undefined;
    p.causaNote = ca.note || undefined;
  }
  if (ctx.tipoAtto) p.tipoAtto = ctx.tipoAtto;
  return p;
}

/**
 * Esegue la generazione AI in streaming.
 * - Modalità reale (AI_COLLEGATO): POST /api/ai → Claude Opus 4.8.
 * - Modalità simulata: motore locale (lib/ai/mock).
 * Chiama `onChunk` ad ogni frammento e ritorna il testo completo.
 */
export interface Turno {
  ruolo: "utente" | "assistente";
  contenuto: string;
}

export interface DocumentoRef {
  path: string;
  nome: string;
  estensione?: string;
}

export async function streamAI(
  modulo: ModuloAI,
  prompt: string,
  ctx: ContestoAI | undefined,
  onChunk: (testoParziale: string) => void,
  signal?: AbortSignal,
  storia?: Turno[],
  documenti?: DocumentoRef[],
  variante?: VarianteParere,
): Promise<string> {
  if (!AI_COLLEGATO) {
    // --- Simulato ---
    const full = generaRisposta(modulo, prompt, ctx);
    let acc = "";
    for await (const chunk of streamRisposta(full, signal)) {
      acc += chunk;
      onChunk(acc);
    }
    return acc;
  }

  // --- Reale ---
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modulo, prompt, contesto: toPayload(ctx), storia, documenti, variante }),
    signal,
  });

  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Errore AI (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
    onChunk(acc);
  }
  return acc;
}
