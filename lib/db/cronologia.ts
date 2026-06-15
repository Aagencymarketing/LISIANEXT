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
  }));
}

export async function insertCronologia(v: VoceCronologia) {
  const { error } = await db().from("cronologia").insert({
    id: v.id,
    testo: v.testo,
    tipo: v.tipo,
    occorrenze: v.occorrenze ?? null,
    created_at: v.createdAt,
  });
  if (error) throw error;
}
