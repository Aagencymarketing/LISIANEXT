import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { searchSentenze, sentenzeConfigurato } from "@/lib/ai/sentenzeServer";
import type { SentenzaRisultato } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Modello economico/veloce per i due step ausiliari (raffinamento + pertinenza).
const MODELLO_AUX = "claude-haiku-4-5";

interface Body {
  testo: string; // parere/atto/risposta generata
  materia?: string;
  leggera?: boolean; // true = risposta immediata (filtro di pertinenza più lasco/saltato)
}

/** Estrae il primo blocco JSON ({...} o [...]) dal testo del modello. */
function estraiJson<T>(s: string): T | null {
  const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Non autorizzato" }, { status: 401 });

  if (!sentenzeConfigurato() || !process.env.ANTHROPIC_API_KEY) {
    return Response.json({ risultati: [] }); // funzione non configurata: nessun precedente
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Richiesta non valida" }, { status: 400 });
  }
  const testo = (body.testo || "").trim();
  if (!testo) return Response.json({ risultati: [] });

  const anthropic = new Anthropic();
  const testoBreve = testo.slice(0, 7000);

  try {
    // --- Step A: raffinamento della query di ricerca ---
    const a = await anthropic.messages.create({
      model: MODELLO_AUX,
      max_tokens: 400,
      system:
        "Sei un assistente legale che prepara una ricerca giurisprudenziale italiana. Dato un testo legale (parere o atto), individua la questione giuridica centrale e produci una query di ricerca efficace per trovare sentenze pertinenti: usa gli istituti, i principi e le parole chiave decisive (non l'intero testo). Rispondi SOLO con JSON: {\"query\": string, \"materia\": string}.",
      messages: [{ role: "user", content: testoBreve }],
    });
    const aText = a.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const refine = estraiJson<{ query?: string; materia?: string }>(aText) || {};
    const query = (refine.query || "").trim() || testoBreve.slice(0, 300);

    // --- Step B: ricerca sentenze reali (con filtro materia "duro") ---
    const area = (refine.materia || body.materia || "").toString().toLowerCase().trim();
    const base = { mode: "content", query_type: "sentenza", query, size: 8, offset: 0 };
    let { risultati } = await searchSentenze(area ? { ...base, area } : base);
    // fallback: se il filtro materia azzera i risultati, riprova senza filtro
    if (risultati.length === 0 && area) {
      ({ risultati } = await searchSentenze(base));
    }
    if (risultati.length === 0) return Response.json({ risultati: [] });

    // --- Step C: filtro di pertinenza ---
    if (body.leggera) {
      // versione leggera (risposta immediata): top 3 senza gate AI
      return Response.json({ risultati: risultati.slice(0, 3) });
    }

    const elenco = risultati
      .map((s, i) => `${i}) ${s.estremi}\n${(s.massima || "").slice(0, 600)}`)
      .join("\n\n");
    const c = await anthropic.messages.create({
      model: MODELLO_AUX,
      max_tokens: 1200,
      system:
        "Sei un giurista che valuta con SEVERITÀ la pertinenza di estratti di sentenze rispetto a un testo legale (parere/atto). Una sentenza è pertinente SOLO se affronta la STESSA specifica questione giuridica del testo (stesso istituto E stesso profilo concreto) ed è direttamente utile a sostegno o a contrasto della tesi. NON basta la stessa materia o un'attinenza generica: in caso di dubbio, scartala (pertinente=false). Meglio poche sentenze davvero centrate che molte vaghe. Rispondi SOLO con un JSON array, un oggetto per estratto: [{\"i\": indice, \"pertinente\": true|false, \"nota\": \"max 14 parole sul perché è davvero pertinente\"}].",
      messages: [
        {
          role: "user",
          content: `TESTO LEGALE:\n${testoBreve}\n\nESTRATTI DI SENTENZE:\n${elenco}`,
        },
      ],
    });
    const cText = c.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const giudizi =
      estraiJson<{ i: number; pertinente: boolean; nota?: string }[]>(cText) || [];

    const pertinenti: SentenzaRisultato[] = [];
    for (const g of giudizi) {
      if (g && g.pertinente && risultati[g.i]) {
        pertinenti.push({ ...risultati[g.i], nota: g.nota || undefined });
      }
    }
    // fallback: se il modello non ha prodotto giudizi validi, restituisci i primi 3
    const finali = pertinenti.length > 0 ? pertinenti : risultati.slice(0, 3);

    return Response.json({ risultati: finali });
  } catch (e) {
    console.error("[api/precedenti]", e);
    return Response.json({ error: "Errore nella ricerca dei precedenti." }, { status: 502 });
  }
}
