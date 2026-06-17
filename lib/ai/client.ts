"use client";

import type { ModuloAI } from "@/lib/types";
import { nomeCliente } from "@/lib/types";
import { generaRisposta, streamRisposta, type ContestoAI } from "@/lib/ai/mock";
import type { ContestoAIPayload } from "@/lib/ai/prompts";

// Flag: AI reale collegata quando la variabile pubblica vale "true".
// In assenza (demo, nessuna chiave), si usa il motore simulato.
export const AI_COLLEGATO =
  process.env.NEXT_PUBLIC_AI_COLLEGATO === "true";

/** Mappa il contesto ricco (oggetti Cliente/Causa) nel payload serializzabile per l'API. */
function toPayload(ctx?: ContestoAI): ContestoAIPayload | undefined {
  if (!ctx) return undefined;
  const p: ContestoAIPayload = {};
  if (ctx.cliente) {
    p.clienteNome = nomeCliente(ctx.cliente);
    p.clienteTipo = ctx.cliente.tipo;
  }
  if (ctx.causa) {
    p.causaOggetto = ctx.causa.oggetto;
    p.causaMateria = ctx.causa.materia;
    p.causaControparte = ctx.causa.controparte;
    p.causaForo = ctx.causa.foro;
    p.causaNumeroRuolo = ctx.causa.numeroRuolo;
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
export async function streamAI(
  modulo: ModuloAI,
  prompt: string,
  ctx: ContestoAI | undefined,
  onChunk: (testoParziale: string) => void,
  signal?: AbortSignal,
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
    body: JSON.stringify({ modulo, prompt, contesto: toPayload(ctx) }),
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
