import { createClient } from "@/lib/supabase/client";
import type { VoceCronologia } from "@/lib/types";

const db = () => createClient();

export async function caricaCronologia(): Promise<VoceCronologia[]> {
  const { data, error } = await db()
    .from("cronologia")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    testo: r.testo,
    tipo: r.tipo,
    occorrenze: r.occorrenze ?? undefined,
    createdAt: r.created_at,
    convId: r.conv_id ?? undefined,
    modulo: r.modulo ?? undefined,
  }));
}

export async function insertCronologia(v: VoceCronologia) {
  const base = {
    id: v.id,
    testo: v.testo,
    tipo: v.tipo,
    occorrenze: v.occorrenze ?? null,
    created_at: v.createdAt,
  };
  const { error } = await db()
    .from("cronologia")
    .insert({ ...base, conv_id: v.convId ?? null, modulo: v.modulo ?? null });
  if (error) {
    // Fallback se le colonne conv_id/modulo non esistono ancora (migration non lanciata):
    // si salva comunque la voce, senza il collegamento.
    const { error: e2 } = await db().from("cronologia").insert(base);
    if (e2) throw e2;
  }
}
