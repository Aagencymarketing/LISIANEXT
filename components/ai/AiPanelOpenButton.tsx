"use client";

import { PanelRight } from "lucide-react";

/**
 * Pulsante orizzontale (icona + etichetta) per aprire il pannello laterale.
 * Su desktop apre il pannello affiancato; su mobile apre il drawer in overlay.
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
      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-foreground"
    >
      <PanelRight size={16} />
      {label}
    </button>
  );
}
