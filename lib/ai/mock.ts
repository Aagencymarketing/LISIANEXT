import type { Cliente, Causa, ModuloAI } from "../types";
import { nomeCliente } from "../types";

// ============================================================
// MOTORE AI SIMULATO
// ------------------------------------------------------------
// Genera risposte placeholder realistiche per la demo.
// Quando ci sarà la API key, sostituire `generaRisposta` con
// una chiamata a Claude (Anthropic). La firma può restare uguale.
// ============================================================

export const AI_COLLEGATO = false;

export interface ContestoAI {
  cliente?: Cliente;
  causa?: Causa;
  tipoAtto?: string;
}

function intestazioneContesto(ctx?: ContestoAI): string {
  if (!ctx?.cliente) return "";
  const parti = [`**Cliente:** ${nomeCliente(ctx.cliente)}`];
  if (ctx.causa) parti.push(`**Pratica:** ${ctx.causa.oggetto}`);
  return parti.join(" · ") + "\n\n";
}

export function generaRisposta(
  modulo: ModuloAI,
  prompt: string,
  ctx?: ContestoAI,
): string {
  const testa = intestazioneContesto(ctx);
  switch (modulo) {
    case "risposta_immediata":
      return (
        testa +
        `In sintesi, rispetto al quesito posto _"${prompt.trim()}"_, l'orientamento prevalente della giurisprudenza di legittimità è il seguente:\n\n` +
        `- La questione va inquadrata nei principi generali in materia, valutando il caso concreto.\n` +
        `- La Cassazione ha più volte ribadito che occorre distinguere il profilo sostanziale da quello processuale.\n` +
        `- Si segnala in particolare l'orientamento per cui la fattispecie richiede un accertamento puntuale degli elementi di fatto.\n\n` +
        `**Conclusione operativa:** la soluzione appare sostenibile, ma è consigliabile verificare i precedenti più recenti nella banca dati prima di procedere.\n\n` +
        `> ⚠️ Risposta dimostrativa generata in locale. Con il collegamento al modello e al database delle sentenze, la risposta citerà i precedenti reali.`
      );
    case "pareri":
      return (
        testa +
        `## Parere legale\n\n` +
        `**Oggetto del quesito**\n${prompt.trim()}\n\n` +
        `**1. Inquadramento della fattispecie**\nLa vicenda sottoposta va ricondotta alla disciplina di settore applicabile, tenuto conto degli elementi fattuali descritti${
          ctx?.cliente ? ` con riferimento alla posizione di ${nomeCliente(ctx.cliente)}` : ""
        }.\n\n` +
        `**2. Quadro normativo e giurisprudenziale**\nVengono in rilievo le disposizioni codicistiche di riferimento, come interpretate dalla giurisprudenza di legittimità più recente. L'orientamento dominante valorizza la ricostruzione complessiva degli interessi in gioco.\n\n` +
        `**3. Analisi e valutazione**\nDall'esame degli elementi disponibili emerge che la posizione appare difendibile. Occorre tuttavia presidiare i profili probatori e i termini processuali.\n\n` +
        `**4. Conclusioni**\nSi ritiene percorribile la strada prospettata, con le cautele indicate. Si suggerisce di acquisire la documentazione integrativa e di monitorare gli sviluppi.\n\n` +
        `> ⚠️ Parere dimostrativo. La versione collegata produrrà un parere completo con citazioni puntuali dai 6,5M+ provvedimenti del database.`
      );
    case "redattore":
      return (
        testa +
        `**${ctx?.tipoAtto || "Atto"}**\n\n` +
        `TRIBUNALE DI ______________\n\n` +
        `**ATTO DI ____________**\n\n` +
        `Per: ${ctx?.cliente ? nomeCliente(ctx.cliente) : "______________"}, rappresentato e difeso dall'Avv. ______________\n\n` +
        `CONTRO: ${ctx?.causa?.controparte || "______________"}\n\n` +
        `**FATTO**\n${prompt.trim()}\n\n` +
        `**DIRITTO**\nLa pretesa trova fondamento nelle norme applicabili e nei principi affermati dalla giurisprudenza in materia. Sussistono i presupposti di legge per l'accoglimento delle domande.\n\n` +
        `**P.Q.M.**\nVoglia l'Ill.mo Tribunale adito, ogni contraria istanza disattesa, accogliere le conclusioni che seguono [...].\n\n` +
        `Luogo e data ____________  —  Avv. ____________\n\n` +
        `> ⚠️ Bozza dimostrativa generata in locale, da rivedere. Con il collegamento, l'atto sarà redatto sui dati reali della pratica e sui precedenti del database.`
      );
    default:
      return testa + "Risposta non disponibile.";
  }
}

/** Suddivide il testo in chunk per simulare lo streaming token-by-token. */
export async function* streamRisposta(
  testo: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const parti = testo.split(/(\s+)/);
  for (const p of parti) {
    if (signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 12 + Math.random() * 22));
    yield p;
  }
}
