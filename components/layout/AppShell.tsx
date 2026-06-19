"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApp } from "@/lib/store";
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
