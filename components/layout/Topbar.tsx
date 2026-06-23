"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui";
import { useApp } from "@/lib/store";
import { useUser, iniziali } from "@/lib/auth/useUser";
import { signOutAction } from "@/lib/auth/actions";
import { Menu, Bell, Sun, Moon, LogOut, ChevronDown } from "lucide-react";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const hydrated = useApp((s) => s.hasHydrated);
  const { user } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const nome = user?.nome || "—";
  const ini = user ? iniziali(user.nome) : "·";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <IconButton onClick={onOpenMenu} className="lg:hidden" aria-label="Apri menu">
        <Menu size={22} />
      </IconButton>

      <div className="flex-1" />

      {/* Notifiche */}
      <div className="relative" ref={notifRef}>
        <IconButton onClick={() => setNotifOpen((v) => !v)} aria-label="Notifiche">
          <Bell size={19} />
        </IconButton>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 animate-in rounded-xl border border-border bg-surface p-1 shadow-[var(--shadow-pop)]">
            <div className="border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">Notifiche</p>
            </div>
            <div className="flex flex-col items-center gap-2 px-3 py-7 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted-2">
                <Bell size={18} />
              </span>
              <p className="text-sm text-muted-2">Nessuna notifica al momento.</p>
            </div>
          </div>
        )}
      </div>

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
