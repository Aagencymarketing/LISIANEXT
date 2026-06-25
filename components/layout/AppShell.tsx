"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApp } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Chiudi il menu mobile a ogni cambio pagina (evita overlay "appiccicati").
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  const theme = useApp((s) => s.theme);
  const hydrated = useApp((s) => s.hasHydrated);
  const hydrateFromSupabase = useApp((s) => s.hydrateFromSupabase);
  const clearLocal = useApp((s) => s.clearLocal);

  // GUARDIA SESSIONE: il browser tiene UNA sola sessione per origine (cookie
  // condivisi tra le schede). Se in un'altra scheda si fa login con un account
  // diverso, qui rileviamo il cambio e ricarichiamo, così non si mostrano mai
  // dati "misti" di un altro utente.
  const utenteRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const supabase = createClient();
    const reagisci = (uid: string | null) => {
      if (utenteRef.current === undefined) {
        utenteRef.current = uid; // primo rilevamento: registra e basta
        return;
      }
      if (uid !== utenteRef.current) {
        utenteRef.current = uid;
        clearLocal();
        window.location.reload();
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      reagisci(session?.user?.id ?? null);
    });
    // Al ritorno sulla scheda (focus/visibilità) ri-controlla il cookie corrente.
    const ricontrolla = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        reagisci(data.session?.user?.id ?? null);
      } catch {
        /* ignora */
      }
    };
    const onFocus = () => ricontrolla();
    const onVis = () => {
      if (document.visibilityState === "visible") ricontrolla();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [clearLocal]);

  // Applica la classe .dark su <html>
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);

  // Carica i dati del gestionale da Supabase all'avvio (utente autenticato)
  useEffect(() => {
    hydrateFromSupabase();
  }, [hydrateFromSupabase]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Drawer mobile */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
