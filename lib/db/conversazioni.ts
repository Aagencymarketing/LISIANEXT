import { createClient } from "@/lib/supabase/client";
import type { ConversazioneAI } from "@/lib/types";

const db = () => createClient();

/* eslint-disable @typescript-eslint/no-explicit-any */
function toConversazione(r: any): ConversazioneAI {
  return {
    id: r.id,
    modulo: r.modulo,
    titolo: r.titolo,
    messaggi: Array.isArray(r.messaggi) ? r.messaggi : [],
    clienteId: r.cliente_id ?? undefined,
    causaId: r.causa_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function caricaConversazioni(): Promise<ConversazioneAI[]> {
  const { data, error } = await db()
    .from("conversazioni")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(toConversazione);
}

export async function insertConversazione(c: ConversazioneAI) {
  const { error } = await db().from("conversazioni").insert({
    id: c.id,
    modulo: c.modulo,
    titolo: c.titolo,
    messaggi: c.messaggi,
    cliente_id: c.clienteId ?? null,
    causa_id: c.causaId ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  });
  if (error) throw error;
}

export async function updateConversazioneDb(
  id: string,
  patch: Partial<ConversazioneAI>,
) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.titolo !== undefined) row.titolo = patch.titolo;
  if (patch.messaggi !== undefined) row.messaggi = patch.messaggi;
  if (patch.clienteId !== undefined) row.cliente_id = patch.clienteId ?? null;
  if (patch.causaId !== undefined) row.causa_id = patch.causaId ?? null;
  const { error } = await db().from("conversazioni").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteConversazioneDb(id: string) {
  const { error } = await db().from("conversazioni").delete().eq("id", id);
  if (error) throw error;
}
