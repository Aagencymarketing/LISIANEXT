"use client";

import type { SentenzaRisultato } from "@/lib/types";
import { SENTENZE_COLLEGATO } from "@/lib/ai/sentenze";

/**
 * Trova precedenti REALI e pertinenti a partire da un testo generato (parere/atto/risposta).
 * Pipeline server: raffina query → cerca → filtro di pertinenza. [] se DB non collegato.
 */
export async function trovaPrecedenti(
  testo: string,
  opts?: { materia?: string; leggera?: boolean },
): Promise<SentenzaRisultato[]> {
  if (!SENTENZE_COLLEGATO) return [];
  const res = await fetch("/api/precedenti", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testo, materia: opts?.materia, leggera: opts?.leggera }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Errore (${res.status})`);
  }
  return (await res.json()).risultati ?? [];
}
