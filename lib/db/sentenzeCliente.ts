import { createClient } from "@/lib/supabase/client";
import type { SentenzaRisultato, SentenzaCliente } from "@/lib/types";

const db = () => createClient();

export async function caricaSentenzeCliente(): Promise<SentenzaCliente[]> {
  const { data, error } = await db()
    .from("sentenze_cliente")
    .select("id, cliente_id, dati, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    clienteId: r.cliente_id as string,
    sentenza: r.dati as SentenzaRisultato,
    createdAt: r.created_at as string,
  }));
}

export async function addSentenzaClienteDb(rec: SentenzaCliente) {
  const { error } = await db().from("sentenze_cliente").insert({
    id: rec.id,
    cliente_id: rec.clienteId,
    sentenza_id: rec.sentenza.id,
    dati: rec.sentenza,
  });
  if (error && error.code !== "23505") throw error; // ignora duplicati
}

export async function removeSentenzaClienteDb(id: string) {
  const { error } = await db().from("sentenze_cliente").delete().eq("id", id);
  if (error) throw error;
}
