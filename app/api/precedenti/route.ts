import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { searchSentenze, sentenzeConfigurato } from "@/lib/ai/sentenzeServer";
import type { SentenzaRisultato } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Step A (generazione query) e Step C (giudizio di pertinenza): modello veloce.
// Il salto di qualità arriva dal RECUPERO ampio (più query, più candidati), non
// dal modello del giudice: Haiku resta rapido e valuta candidati già buoni.
// (Sonnet sul giudizio rendeva la risposta troppo lenta, >30s.)
const MODELLO_QUERY = "claude-haiku-4-5";
const MODELLO_GIUDICE = "claude-haiku-4-5";

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
    // --- Step A: 2-3 query (angoli diversi = più recall su 6,5M sentenze) ---
    const a = await anthropic.messages.create({
      model: MODELLO_QUERY,
      max_tokens: 500,
      system:
        "Sei un assistente legale che prepara una ricerca giurisprudenziale italiana. Dal testo legale (parere o atto) individua le 2-3 questioni giuridiche centrali e, per CIASCUNA, produci una query di ricerca specifica ed efficace (istituti, principi e parole chiave decisive; NON l'intero testo). Le query devono coprire angoli diversi della stessa vicenda. Rispondi SOLO con JSON: {\"queries\": [string, ...], \"materia\": string}.",
      messages: [{ role: "user", content: testoBreve }],
    });
    const aText = a.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const refine = estraiJson<{ queries?: string[]; materia?: string }>(aText) || {};
    let queries = (refine.queries || [])
      .map((q) => (q || "").toString().trim())
      .filter(Boolean)
      .slice(0, 3);
    if (queries.length === 0) queries = [testoBreve.slice(0, 300)];

    // --- Step B: recupero AMPIO ("rete larga"): più query, fino a ~40 candidati,
    // SENZA filtro materia duro (escludeva buone sentenze) — la precisione la
    // garantisce il filtro severo dello Step C. ---
    const ricerche = await Promise.all(
      queries.map((query) =>
        searchSentenze({ mode: "content", query_type: "sentenza", query, size: 10, offset: 0 }).catch(
          () => ({ risultati: [] as SentenzaRisultato[], total: 0 }),
        ),
      ),
    );
    const visti = new Set<string>();
    const candidati: SentenzaRisultato[] = [];
    for (const { risultati } of ricerche) {
      for (const s of risultati) {
        if (!visti.has(s.id)) {
          visti.add(s.id);
          candidati.push(s);
        }
      }
    }
    if (candidati.length === 0) return Response.json({ risultati: [] });
    const pool = candidati.slice(0, 24);

    // --- Step C: filtro di pertinenza ---
    if (body.leggera) {
      // versione leggera (risposta immediata): top dal pool, senza gate AI.
      return Response.json({ risultati: pool.slice(0, 6) });
    }

    const elenco = pool
      .map((s, i) => `${i}) ${s.estremi}\n${(s.massima || "").slice(0, 600)}`)
      .join("\n\n");
    const c = await anthropic.messages.create({
      model: MODELLO_GIUDICE,
      max_tokens: 1200,
      system:
        "Sei un giurista che seleziona con SEVERITÀ, tra estratti di sentenze, SOLO quelli pertinenti a un testo legale (parere/atto). Una sentenza è pertinente SOLO se affronta la STESSA specifica questione giuridica del testo (stesso istituto E stesso profilo concreto) ed è direttamente utile a sostegno o a contrasto della tesi. NON basta la stessa materia o un'attinenza generica: in caso di dubbio, SCARTALA. Meglio poche sentenze davvero centrate che molte vaghe. Restituisci SOLO le pertinenti (scarta tutte le altre), come JSON array ordinato dalla più pertinente alla meno: [{\"i\": indice, \"nota\": \"max 14 parole sul perché è pertinente\"}]. Se NESSUNA è pertinente, restituisci [].",
      messages: [
        {
          role: "user",
          content: `TESTO LEGALE:\n${testoBreve}\n\nESTRATTI DI SENTENZE:\n${elenco}`,
        },
      ],
    });
    const cText = c.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const giudizi = estraiJson<{ i: number; nota?: string }[]>(cText);

    // Ripiego SOLO se la lettura del giudizio fallisce per errore tecnico (JSON
    // non parsabile). Se invece il giudizio è valido ma vuoto, è corretto non
    // mostrare nulla: niente sentenze "finte". (Con ~24 candidati è raro.)
    if (!giudizi) {
      return Response.json({ risultati: pool.slice(0, 3) });
    }

    const pertinenti: SentenzaRisultato[] = [];
    for (const g of giudizi) {
      if (g && typeof g.i === "number" && pool[g.i]) {
        pertinenti.push({ ...pool[g.i], nota: g.nota || undefined });
      }
    }

    return Response.json({ risultati: pertinenti });
  } catch (e) {
    console.error("[api/precedenti]", e);
    return Response.json({ error: "Errore nella ricerca dei precedenti." }, { status: 502 });
  }
}
