import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase per i Componenti Client (browser).
 * SINGLETON: una sola istanza riusata in tutta l'app. Creare più istanze
 * provoca refresh del token in parallelo (corsa sulla rotazione del refresh
 * token) e deadlock del lock auth → la piattaforma si "blocca" e serve ri-login.
 */
let istanza: SupabaseClient | undefined;

// Lock in-memory (serializza i refresh nell'unica istanza) al posto di
// navigator.locks, che in alcuni casi resta appeso a tempo indefinito.
let catena: Promise<unknown> = Promise.resolve();
function memoryLock<T>(_name: string, _acquireTimeout: number, fn: () => Promise<T>): Promise<T> {
  const run = catena.then(() => fn(), () => fn());
  catena = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function createClient(): SupabaseClient {
  if (istanza) return istanza;
  istanza = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: memoryLock as any,
      },
    },
  );
  return istanza;
}
