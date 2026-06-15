"use client";

import { IconButton } from "@/components/ui";
import { useApp } from "@/lib/store";
import { PanelLeft, Bell, Sun, Moon } from "lucide-react";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const hydrated = useApp((s) => s.hasHydrated);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <IconButton onClick={onOpenMenu} className="lg:hidden" aria-label="Apri menu">
        <PanelLeft size={20} />
      </IconButton>

      <div className="flex-1" />

      {/* Credito / saldo */}
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-primary-soft text-[10px] text-primary">
          €
        </span>
        295,97
      </div>

      <IconButton aria-label="Notifiche" className="relative">
        <Bell size={19} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
      </IconButton>

      <IconButton onClick={toggleTheme} aria-label="Cambia tema">
        {hydrated && theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}
      </IconButton>

      <div className="flex items-center gap-2.5 pl-1">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
          D
        </div>
        <div className="hidden text-sm font-semibold sm:block">Demo</div>
      </div>
    </header>
  );
}
