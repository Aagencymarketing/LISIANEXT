"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ConversazioniPanel } from "./ConversazioniPanel";
import type { ConversazioneAI, ModuloAI } from "@/lib/types";

/**
 * Versione MOBILE del pannello conversazioni: drawer in overlay che scorre da
 * destra, SOTTO l'header (che resta sempre visibile), con sfondo oscurato/sfocato.
 * Renderizzato via portal sul body così il posizionamento `fixed` è sempre
 * relativo al viewport (e non viene "intrappolato" da contenitori con transform,
 * es. `animate-in` sulle pagine Pareri/Redattore). Visibile solo sotto lg.
 */
export function ConversazioniDrawer({
  open,
  modulo,
  titolo,
  attivoId,
  onApri,
  onNuova,
  onClose,
}: {
  open: boolean;
  modulo: ModuloAI;
  titolo?: string;
  attivoId?: string;
  onApri: (c: ConversazioneAI) => void;
  onNuova?: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Blocca lo scroll del body mentre il drawer è aperto (solo su mobile).
  useEffect(() => {
    if (!open) return;
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    // top-16 = altezza dell'header (h-16): il drawer parte sotto l'header.
    <div className="fixed inset-x-0 bottom-0 top-16 z-40 lg:hidden">
      <div
        className="absolute inset-0 animate-in bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute bottom-0 right-0 top-0 flex w-[86%] max-w-sm flex-col border-l border-border bg-surface p-4 shadow-[var(--shadow-pop)] animate-in">
        <ConversazioniPanel
          modulo={modulo}
          titolo={titolo}
          attivoId={attivoId}
          onNuova={onNuova ? () => { onNuova(); onClose(); } : undefined}
          onApri={(c) => { onApri(c); onClose(); }}
          onClose={onClose}
        />
      </aside>
    </div>,
    document.body,
  );
}
