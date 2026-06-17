"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui";
import { useApp } from "@/lib/store";
import { useUser, iniziali } from "@/lib/auth/useUser";
import { signOutAction } from "@/lib/auth/actions";
import { PanelLeft, Bell, Sun, Moon, LogOut, ChevronDown } from "lucide-react";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const hydrated = useApp((s) => s.hasHydrated);
  const { user } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const nome = user?.nome || "—";
  const ini = user ? iniziali(user.nome) : "·";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <IconButton onClick={onOpenMenu} className="lg:hidden" aria-label="Apri menu">
        <PanelLeft size={20} />
      </IconButton>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-primary-soft text-[10px] text-primary">
          €
        </span>
        0,00
      </div>

      <IconButton aria-label="Notifiche" className="relative">
        <Bell size={19} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
      </IconButton>

      <IconButton onClick={toggleTheme} aria-label="Cambia tema">
        {hydrated && theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}
      </IconButton>

      {/* Menu utente */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-surface-hover"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {ini}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm font-semibold sm:block">
            {nome}
          </span>
          <ChevronDown size={15} className="hidden text-muted-2 sm:block" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 animate-in rounded-xl border border-border bg-surface p-1 shadow-[var(--shadow-pop)]">
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-sm font-semibold">{nome}</p>
              <p className="truncate text-xs text-muted-2">{user?.email}</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-surface-hover"
              >
                <LogOut size={16} className="text-muted" /> Esci
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
