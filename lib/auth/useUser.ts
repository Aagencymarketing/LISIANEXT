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
    let attivo = true;

    async function carica() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!attivo) return;
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      let nome = (u.user_metadata?.nome_completo as string) || "";
      const { data: profilo } = await supabase
        .from("profiles")
        .select("nome_completo")
        .eq("id", u.id)
        .maybeSingle();
      if (profilo?.nome_completo) nome = profilo.nome_completo;
      if (!nome) nome = (u.email || "").split("@")[0];
      if (!attivo) return;
      setUser({ id: u.id, email: u.email || "", nome });
      setLoading(false);
    }

    carica();
    const { data: sub } = supabase.auth.onAuthStateChange(() => carica());
    return () => {
      attivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/).filter(Boolean);
  if (parti.length === 0) return "?";
  if (parti.length === 1) return parti[0].slice(0, 2).toUpperCase();
  return (parti[0][0] + parti[1][0]).toUpperCase();
}
