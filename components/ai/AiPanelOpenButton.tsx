"use client";

import { PanelRight } from "lucide-react";

/**
 * Pulsante orizzontale (icona + etichetta) per riaprire il pannello laterale,
 * posizionato in alto a destra del contenuto. Visibile solo da lg in su.
 */
export function AiPanelOpenButton({
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
      className="hidden items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-foreground lg:inline-flex"
    >
      <PanelRight size={16} />
      {label}
    </button>
  );
}
