import { createClient } from "@/lib/supabase/client";

const db = () => createClient();

export async function caricaPreferiti(): Promise<string[]> {
  const { data, error } = await db()
    .from("preferiti")
    .select("sentenza_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => r.sentenza_id as string);
}

export async function addPreferitoDb(sentenzaId: string) {
  const { error } = await db()
    .from("preferiti")
    .insert({ sentenza_id: sentenzaId });
  if (error && error.code !== "23505") throw error; // ignora duplicati
}

export async function removePreferitoDb(sentenzaId: string) {
  const { error } = await db()
    .from("preferiti")
    .delete()
    .eq("sentenza_id", sentenzaId);
  if (error) throw error;
}
