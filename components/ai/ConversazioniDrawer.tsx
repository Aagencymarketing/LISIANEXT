"use client";

import { useEffect } from "react";
import { ConversazioniPanel } from "./ConversazioniPanel";
import type { ConversazioneAI, ModuloAI } from "@/lib/types";

/**
 * Versione MOBILE del pannello conversazioni: drawer in overlay sopra il
 * contenuto, con sfondo oscurato/sfocato. Non restringe la pagina (a differenza
 * del pannello desktop affiancato). Visibile solo sotto il breakpoint lg.
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
  // Blocca lo scroll del body mentre il drawer è aperto (solo su mobile;
  // su desktop il drawer è nascosto e non deve interferire).
  useEffect(() => {
    if (!open) return;
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 animate-in bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-surface p-4 shadow-[var(--shadow-pop)] animate-in">
        <ConversazioniPanel
          modulo={modulo}
          titolo={titolo}
          attivoId={attivoId}
          onNuova={onNuova ? () => { onNuova(); onClose(); } : undefined}
          onApri={(c) => { onApri(c); onClose(); }}
          onClose={onClose}
        />
      </aside>
    </div>
  );
}
