import { mapRisposta } from "./sentenzeMap";
import type { SentenzaRisultato } from "@/lib/types";

// ============================================================
// Ricerca sentenze LATO SERVER (riusata da /api/sentenze e /api/precedenti).
// Tiene la chiave segreta e chiama aiapi.lisia.it.
// ============================================================

export function sentenzeConfigurato(): boolean {
  return !!(process.env.SENTENZE_API_KEY && process.env.SENTENZE_API_URL);
}

export async function searchSentenze(
  payload: Record<string, unknown>,
): Promise<{ risultati: SentenzaRisultato[]; total: number }> {
  const KEY = process.env.SENTENZE_API_KEY!;
  const URL = process.env.SENTENZE_API_URL!.replace(/\/$/, "");
  const res = await fetch(`${URL}/api/search`, {
    method: "POST",
    headers: { Authorization: `ApiKey ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`sentenze upstream ${res.status} ${t.slice(0, 200)}`);
  }
  return mapRisposta(await res.json());
}
