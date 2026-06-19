import { createClient } from "@/lib/supabase/client";
import type { SentenzaRisultato } from "@/lib/types";

const db = () => createClient();

/** Carica i preferiti come snapshot completi (con fallback per righe vecchie senza `dati`). */
export async function caricaPreferiti(): Promise<SentenzaRisultato[]> {
  const { data, error } = await db()
    .from("preferiti")
    .select("sentenza_id, dati")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((r): SentenzaRisultato => {
      if (r.dati) return r.dati as SentenzaRisultato;
      // riga vecchia (solo id): card minimale
      return {
        id: r.sentenza_id as string,
        estremi: r.sentenza_id as string,
        data: "",
        materia: "",
        massima: "",
        rilevanza: 0,
        fonte: "",
      };
    })
    .filter((s) => s.id);
}

export async function addPreferitoDb(s: SentenzaRisultato) {
  const { error } = await db()
    .from("preferiti")
    .insert({ sentenza_id: s.id, dati: s });
  if (error && error.code !== "23505") throw error; // ignora duplicati
}

export async function removePreferitoDb(sentenzaId: string) {
  const { error } = await db().from("preferiti").delete().eq("sentenza_id", sentenzaId);
  if (error) throw error;
}
