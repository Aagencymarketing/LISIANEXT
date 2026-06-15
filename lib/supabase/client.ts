import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase per i Componenti Client (browser).
 * Usa la chiave pubblica `anon` — i dati sono protetti dalle policy RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
