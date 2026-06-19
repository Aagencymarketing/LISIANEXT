export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** UUID v4 completo — usato per gli id delle entità persistite su Supabase. */
export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // fallback non crittografico
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const MESI = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

export function formatData(iso?: string, conOra = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const base = `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
  if (!conOra) return base;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${base}, ${hh}:${mm}`;
}

export function tempoFa(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return "ora";
  if (min < 60) return `${min} min fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h fa`;
  const g = Math.round(h / 24);
  if (g < 30) return `${g} g fa`;
  const mesi = Math.round(g / 30);
  if (mesi < 12) return `${mesi} ${mesi === 1 ? "mese" : "mesi"} fa`;
  return `${Math.round(mesi / 12)} anni fa`;
}

export function formatEuro(n?: number): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function oggi(): string {
  return new Date().toISOString();
}

/** Nome di battesimo da un nome completo, togliendo i titoli (Avv., Dott., ...). */
export function primoNome(nomeCompleto?: string): string {
  if (!nomeCompleto) return "Avvocato";
  const titoli = /^(avv\.?(ssa)?|avvocat[oa]|dott\.?(ssa)?|dottor(essa)?|prof\.?(ssa)?)\s+/i;
  const pulito = nomeCompleto.trim().replace(titoli, "");
  return pulito.split(/\s+/)[0] || nomeCompleto.trim();
}
