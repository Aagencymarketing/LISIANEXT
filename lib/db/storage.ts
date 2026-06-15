import { createClient } from "@/lib/supabase/client";
import { uuid } from "@/lib/utils";

const BUCKET = "documenti";

function sanitize(nome: string): string {
  return nome.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Carica un file reale nel bucket privato, sotto il prefisso dell'utente. */
export async function uploadDocumento(
  file: File,
  userId: string,
  clienteId: string,
): Promise<{ storagePath: string; nome: string; estensione: string }> {
  const supabase = createClient();
  const parti = file.name.split(".");
  const estensione = parti.length > 1 ? parti.pop()! : "bin";
  const nome = parti.join(".");
  const storagePath = `${userId}/${clienteId}/${uuid()}-${sanitize(file.name)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: false });
  if (error) throw error;

  return { storagePath, nome, estensione };
}

/** URL firmato temporaneo per scaricare/visualizzare il documento. */
export async function signedUrlDocumento(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 120);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteStorageObject(storagePath: string) {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
