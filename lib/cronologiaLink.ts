import type { VoceCronologia } from "@/lib/types";

/**
 * Destinazione corretta per una voce di cronologia.
 * Se la voce è collegata a un lavoro salvato (parere/atto/risposta), apre la
 * SUA sezione con il lavoro intero (`?apri=<convId>`); altrimenti (ricerche di
 * sentenze) rimanda alla ricerca legale con la query completa.
 */
export function linkVoceCronologia(v: VoceCronologia): string {
  if (v.convId && v.modulo) {
    const base =
      v.modulo === "pareri"
        ? "/ai/pareri"
        : v.modulo === "redattore"
        ? "/ai/redattore"
        : v.modulo === "risposta_immediata"
        ? "/ai/risposta-immediata"
        : null;
    if (base) return `${base}?apri=${encodeURIComponent(v.convId)}`;
  }
  return `/ricerche?q=${encodeURIComponent(v.testo)}`;
}
