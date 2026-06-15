"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UtenteCorrente {
  id: string;
  email: string;
  nome: string; // nome_completo o, in mancanza, parte dell'email
}

export function useUser() {
  const [user, setUser] = useState<UtenteCorrente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Usa la sessione fornita dall'evento (INITIAL_SESSION arriva al mount).
    // NON chiamare getSession/getUser qui dentro: causerebbe un deadlock del lock auth.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      const nome =
        (u.user_metadata?.nome_completo as string) ||
        (u.email || "").split("@")[0] ||
        "Avvocato";
      setUser({ id: u.id, email: u.email || "", nome });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/).filter(Boolean);
  if (parti.length === 0) return "?";
  if (parti.length === 1) return parti[0].slice(0, 2).toUpperCase();
  return (parti[0][0] + parti[1][0]).toUpperCase();
}
