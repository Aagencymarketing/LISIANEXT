import { createClient } from "@/lib/supabase/server";
import { mapRisposta } from "@/lib/ai/sentenzeMap";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MetadatiRicerca {
  number?: string | number;
  year?: string | number;
  place?: string;
  region?: string;
  issuer?: string;
  area?: string;
  section?: string;
  date_from?: string;
  date_to?: string;
}

interface Body {
  mode?: "content" | "metadata";
  query?: string;
  metadati?: MetadatiRicerca;
  size?: number;
  offset?: number;
}

export async function POST(req: Request) {
  // 1) Solo utenti autenticati
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Non autorizzato" }, { status: 401 });

  // 2) Configurazione presente?
  const KEY = process.env.SENTENZE_API_KEY;
  const URL = process.env.SENTENZE_API_URL;
  if (!KEY || !URL) {
    return Response.json({ error: "Banca dati sentenze non configurata." }, { status: 503 });
  }

  // 3) Body
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Richiesta non valida" }, { status: 400 });
  }
  const mode = body.mode === "metadata" ? "metadata" : "content";
  const size = Math.min(Math.max(body.size ?? 10, 1), 30);
  const offset = body.offset ?? 0;

  // 4) Costruzione payload per l'API esterna (campi a livello top, come nell'esempio reale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = { mode, query_type: "sentenza", size, offset };
  if (mode === "content") {
    if (!body.query?.trim()) return Response.json({ error: "Query mancante" }, { status: 400 });
    payload.query = body.query.trim();
  } else {
    const m = body.metadati ?? {};
    for (const k of ["number", "year", "place", "region", "issuer", "area", "section", "date_from", "date_to"] as const) {
      const v = m[k];
      if (v !== undefined && v !== "" && v !== null) payload[k] = v;
    }
  }

  // 5) Chiamata all'API esterna sentenze
  try {
    const res = await fetch(`${URL.replace(/\/$/, "")}/api/search`, {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("[api/sentenze] upstream", res.status, t.slice(0, 300));
      return Response.json({ error: "Banca dati non disponibile, riprova." }, { status: 502 });
    }
    const json = await res.json();
    const { risultati, total } = mapRisposta(json);
    return Response.json({ risultati, total }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/sentenze]", e);
    return Response.json({ error: "Errore nella ricerca sentenze." }, { status: 502 });
  }
}
