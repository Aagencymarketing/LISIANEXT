"use client";

import { PanelLeftOpen } from "lucide-react";

/**
 * Aletta sul bordo destro per riaprire il pannello laterale (quando è chiuso).
 * Sta fuori dal contenuto: occupa una colonna sottile a destra.
 */
export function AiPanelHandle({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`Apri ${label}`}
      title={`Apri ${label}`}
      className="sticky top-4 hidden shrink-0 select-none flex-col items-center gap-2 self-start rounded-xl border border-border bg-surface px-2.5 py-4 text-muted transition hover:bg-surface-hover hover:text-foreground lg:flex"
    >
      <PanelLeftOpen size={16} />
      <span className="rotate-180 text-xs font-medium tracking-wide [writing-mode:vertical-rl]">
        {label}
      </span>
    </button>
  );
}
