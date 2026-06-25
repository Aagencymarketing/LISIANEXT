import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { searchSentenze, sentenzeConfigurato } from "@/lib/ai/sentenzeServer";
import type { SentenzaRisultato } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Modello veloce: serve solo a estrarre le citazioni dal testo.
const MODELLO = "claude-haiku-4-5";

interface CitazioneRaw {
  citazione?: string;
  numero?: string;
  anno?: string;
  organo?: string;
  luogo?: string;
}

interface Body {
  testo?: string;
}

function estraiJson<T>(s: string): T | null {
  const m = s.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

// Normalizza l'organo della citazione al valore atteso dal DB (issuer) e a una
// parola-chiave per verificare il match negli estremi del risultato.
function normalizzaOrgano(organo: string): { issuer?: string; keyword: string } {
  const o = (organo || "").toLowerCase();
  if (/cassazion|cass\.|cass\b|legittim/.test(o)) return { issuer: "Cassazione", keyword: "cassazion" };
  if (/consiglio di stato/.test(o)) return { issuer: "Consiglio di Stato", keyword: "consiglio di stato" };
  if (/costituzional|consulta/.test(o)) return { issuer: "Corte Costituzionale", keyword: "costituzional" };
  if (/t\.?a\.?r|amministrativo region/.test(o)) return { issuer: "TAR", keyword: "tar" };
  if (/appello|app\./.test(o)) return { keyword: "appello" };
  if (/tribunale|trib\./.test(o)) return { keyword: "tribunale" };
  return { keyword: "" };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Non autorizzato" }, { status: 401 });

  if (!sentenzeConfigurato() || !process.env.ANTHROPIC_API_KEY) {
    return Response.json({ sentenze: [] });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Richiesta non valida" }, { status: 400 });
  }
  const testo = (body.testo || "").trim();
  if (!testo) return Response.json({ sentenze: [] });

  const anthropic = new Anthropic();
  try {
    // --- Step 1: estrai le citazioni di GIURISPRUDENZA dal testo ---
    const a = await anthropic.messages.create({
      model: MODELLO,
      max_tokens: 1500,
      system:
        "Estrai dal testo legale TUTTE le citazioni di GIURISPRUDENZA (sentenze, ordinanze, decreti di organi giudiziari: Cassazione, Tribunale, Corte d'Appello, Consiglio di Stato, TAR, Corte Costituzionale, ecc.). NON estrarre norme o articoli di legge (es. 'art. 1137 c.c.', 'D.Lgs. 28/2010', nomi di leggi). Niente duplicati. Per ciascuna citazione restituisci la stringa come appare nel testo e gli estremi separati. Rispondi SOLO con JSON array: [{\"citazione\": string, \"numero\": string, \"anno\": string, \"organo\": string, \"luogo\": string}]. Usa \"\" per i campi non presenti.",
      messages: [{ role: "user", content: testo.slice(0, 12000) }],
    });
    const aText = a.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const citazioni = (estraiJson<CitazioneRaw[]>(aText) || []).filter(
      (c) => c && (c.citazione || c.numero),
    );

    // --- Step 2: per ciascuna, cerca nel DB per estremi (verifica + testo integrale) ---
    const sentenze = await Promise.all(
      citazioni.slice(0, 15).map(async (c) => {
        // Solo il primo gruppo di cifre: Haiku a volte scrive "5258/2023" nel numero.
        const numero = ((c.numero || "").toString().match(/\d+/) || [""])[0];
        const anno = ((c.anno || "").toString().match(/\d{4}/) || [""])[0];
        const citazione = (
          c.citazione ||
          `${c.organo || ""} n. ${c.numero || ""}${c.anno ? "/" + c.anno : ""}`
        ).trim();
        if (!numero) return { citazione, trovata: false as const };
        try {
          const norm = normalizzaOrgano(`${c.organo || ""} ${c.citazione || ""}`);
          const luogo = (c.luogo || "").trim();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const base: Record<string, any> = {
            mode: "metadata",
            query_type: "sentenza",
            size: 8,
            offset: 0,
            number: numero,
          };
          if (anno) base.year = anno;
          // Tentativi in ordine di precisione: per organo, per luogo, solo numero+anno.
          const tentativi: Record<string, unknown>[] = [];
          if (norm.issuer) tentativi.push({ ...base, issuer: norm.issuer });
          if (luogo) tentativi.push({ ...base, place: luogo });
          tentativi.push({ ...base });

          const re = new RegExp(`(^|[^0-9])${numero}([^0-9]|$)`);
          let match: SentenzaRisultato | undefined;
          for (const t of tentativi) {
            const { risultati } = await searchSentenze(t);
            const cand = risultati.filter((s) => re.test(s.estremi || ""));
            // Se conosco l'organo, accetto SOLO il risultato il cui organo combacia
            // (evita di agganciare un TAR con lo stesso numero a una citazione di Cassazione).
            match = norm.keyword
              ? cand.find((s) => (s.estremi || "").toLowerCase().includes(norm.keyword))
              : cand[0];
            if (match) break;
          }
          if (match) return { citazione, trovata: true as const, sentenza: match };
          return { citazione, trovata: false as const };
        } catch {
          return { citazione, trovata: false as const };
        }
      }),
    );

    return Response.json({ sentenze });
  } catch (e) {
    console.error("[api/sentenze-citate]", e);
    return Response.json({ sentenze: [] });
  }
}

export type SentenzaCitataServer = {
  citazione: string;
  trovata: boolean;
  sentenza?: SentenzaRisultato;
};
