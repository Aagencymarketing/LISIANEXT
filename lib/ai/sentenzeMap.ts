import type { SentenzaRisultato } from "@/lib/types";

// ============================================================
// Mapper risposta API sentenze reale (aiapi.lisia.it /api/search)
// → SentenzaRisultato. Pure function, testabile.
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// valori-segnaposto del DB da trattare come "vuoto"
const PLACEHOLDER = new Set(["", "nd", "n.d.", "n/d", "na", "-", "x", "sconosciuto", "sconosciuta", "null"]);
function pulito(v?: string | number): string {
  const s = (v ?? "").toString().trim();
  return PLACEHOLDER.has(s.toLowerCase()) ? "" : s;
}

function cap(s?: string): string {
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function dataIso(item: any): string {
  const doc = item?.document ?? {};
  return item?.document_date || doc.ruling_date_txt || "";
}

function dataEstesa(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

/** Costruisce gli estremi nel formato forense, es. "Corte di Cassazione di Roma, Sez. L, 10 febbraio 2015, n. 2544". */
function buildEstremi(item: any): string {
  const doc = item?.document ?? {};
  const organo = cap(pulito(item?.document_emanante || doc.ruling_issuer_type));
  const sede = pulito(item?.document_place || doc.ruling_town || item?.document_region || doc.ruling_region);
  const sezione = pulito(item?.document_sezione || doc.ruling_section);
  const numero = doc.ruling_number ?? item?.sent_numero;
  const anno = doc.ruling_year ?? item?.sent_anno;
  const tipo = (doc.ruling_item_type || "sentenza").toLowerCase();
  const data = dataEstesa(dataIso(item));

  const parti: string[] = [];
  const testa = organo ? organo + (sede ? ` di ${cap(sede)}` : "") : "";
  if (testa) parti.push(testa);
  if (sezione) parti.push(`Sez. ${sezione}`);
  if (data) parti.push(data);
  let estremi = parti.join(", ");
  const tipoLabel = tipo && tipo !== "sentenza" ? `${tipo} ` : "";
  if (numero != null) {
    const numStr = `${tipoLabel}n. ${numero}${anno ? `/${anno}` : ""}`;
    estremi = estremi ? `${estremi}, ${numStr}` : cap(numStr);
  }
  // se non c'era né organo né data: prefisso minimo
  return estremi || `Provvedimento ${numero ?? ""}`.trim();
}

function mapItem(item: any): SentenzaRisultato {
  const doc = item?.document ?? {};
  const rulingId = doc.ruling_id != null ? String(doc.ruling_id) : String(item?.id ?? "");
  const organo = cap(pulito(item?.document_emanante || doc.ruling_issuer_type));
  const sede = pulito(item?.document_place || doc.ruling_town);
  return {
    id: rulingId,
    rulingId,
    estremi: buildEstremi(item),
    data: dataIso(item),
    materia: cap(pulito(item?.document_area || doc.ruling_law_type)),
    massima: (item?.document_text || "").trim(),
    rilevanza: typeof item?.score === "number" ? item.score : 0, // normalizzato dopo, vedi mapRisposta
    fonte: organo ? organo + (sede ? ` · ${cap(sede)}` : "") : "",
    testoCompleto: doc.ruling_full_text || undefined,
    tipo: doc.ruling_item_type || undefined,
  };
}

/**
 * Mappa la risposta completa dell'API: estrae `data.search[]`, mappa ogni item,
 * deduplica per `ruling_id` (più estratti = stessa sentenza) tenendo quello con
 * score più alto, e normalizza la rilevanza in 0..1 (rispetto al punteggio massimo).
 */
export function mapRisposta(json: any): { risultati: SentenzaRisultato[]; total: number } {
  const data = json?.data ?? {};
  const items: any[] = Array.isArray(data.search) ? data.search : [];

  // dedup per ruling_id, tenendo lo score più alto
  const perRuling = new Map<string, { item: any; score: number }>();
  for (const it of items) {
    const rid = String(it?.document?.ruling_id ?? it?.id ?? Math.random());
    const score = typeof it?.score === "number" ? it.score : 0;
    const prev = perRuling.get(rid);
    if (!prev || score > prev.score) perRuling.set(rid, { item: it, score });
  }

  let mappati = [...perRuling.values()]
    .sort((a, b) => b.score - a.score)
    .map((x) => mapItem(x.item));

  // dedup secondaria (stessa sentenza con ruling_id diversi nel DB), per
  // organo+sede + "n. numero/anno" (ignorando la sezione, che a volte varia).
  const visti = new Set<string>();
  mappati = mappati.filter((m) => {
    const organoSede = m.estremi.split(",")[0]?.toLowerCase().trim() || "";
    const num = (m.estremi.match(/n\.\s*\d+\/\d+/i) || [""])[0].toLowerCase();
    const k = `${organoSede}|${num}`;
    if (k === "|" || visti.has(k)) return false;
    visti.add(k);
    return true;
  });

  // normalizza rilevanza rispetto al massimo (solo se ci sono score > 0)
  const maxScore = Math.max(0, ...mappati.map((m) => m.rilevanza));
  for (const m of mappati) {
    m.rilevanza = maxScore > 0 ? Math.min(1, m.rilevanza / maxScore) : 0;
  }

  return { risultati: mappati, total: typeof data.total === "number" ? data.total : mappati.length };
}
