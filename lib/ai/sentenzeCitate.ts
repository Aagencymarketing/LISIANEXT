"use client";

import type { SentenzaRisultato } from "@/lib/types";

export interface SentenzaCitata {
  citazione: string; // come appare nel parere/atto
  trovata: boolean;
  sentenza?: SentenzaRisultato; // se trovata nel DB (con testo integrale)
}

/** Estrae le sentenze citate nel testo e le aggancia alla banca dati. */
export async function trovaSentenzeCitate(testo: string): Promise<SentenzaCitata[]> {
  const res = await fetch("/api/sentenze-citate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testo }),
  });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.sentenze ?? []) as SentenzaCitata[];
}

/** Ricerca manuale (per la "Sentenza mancante"): cerca per testo e ritorna la prima. */
export async function cercaSentenzaManuale(query: string): Promise<SentenzaRisultato | undefined> {
  const q = query.trim();
  if (!q) return undefined;
  const res = await fetch("/api/sentenze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "content", query: q, size: 1 }),
  });
  if (!res.ok) return undefined;
  const j = await res.json();
  return ((j.risultati ?? []) as SentenzaRisultato[])[0];
}
