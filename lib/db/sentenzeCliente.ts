import { createClient } from "@/lib/supabase/client";
import type { SentenzaRisultato, SentenzaCliente } from "@/lib/types";

const db = () => createClient();

export async function caricaSentenzeCliente(): Promise<SentenzaCliente[]> {
  const { data, error } = await db()
    .from("sentenze_cliente")
    .select("id, cliente_id, causa_id, dati, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    clienteId: r.cliente_id as string,
    causaId: (r.causa_id as string) ?? undefined,
    sentenza: r.dati as SentenzaRisultato,
    createdAt: r.created_at as string,
  }));
}

export async function addSentenzaClienteDb(rec: SentenzaCliente) {
  const base = {
    id: rec.id,
    cliente_id: rec.clienteId,
    sentenza_id: rec.sentenza.id,
    dati: rec.sentenza,
  };
  const { error } = await db()
    .from("sentenze_cliente")
    .insert({ ...base, causa_id: rec.causaId ?? null });
  if (error && error.code === "23505") return; // duplicato: ok
  if (error) {
    // Fallback se la colonna causa_id non esiste ancora (migration non lanciata).
    const { error: e2 } = await db().from("sentenze_cliente").insert(base);
    if (e2 && e2.code !== "23505") throw e2;
  }
}

export async function updateSentenzaClienteDb(id: string, patch: { causaId?: string | null }) {
  const { error } = await db()
    .from("sentenze_cliente")
    .update({ causa_id: patch.causaId ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function removeSentenzaClienteDb(id: string) {
  const { error } = await db().from("sentenze_cliente").delete().eq("id", id);
  if (error) throw error;
}
