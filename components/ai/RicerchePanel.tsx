"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/lib/store";
import { formatData } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { Search, PanelRightClose, Clock } from "lucide-react";

/** Pulisce il testo di una voce di ricerca per il riavvio (toglie "Estremi:"). */
function queryDaVoce(testo: string): string {
  return testo.replace(/^Estremi:\s*/i, "").trim();
}

/** Pannello "Ricerche fatte": elenco delle ricerche passate, cliccabili per rieseguirle. */
export function RicerchePanel({
  attivo,
  onCerca,
  onClose,
}: {
  attivo?: string;
  onCerca: (q: string) => void;
  onClose?: () => void;
}) {
  const cronologia = useApp((s) => s.cronologia);
  const lista = cronologia.filter((v) => v.tipo === "Sentenze" || v.tipo === "Massime");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Clock size={16} className="text-primary" />
          Ricerche fatte
          <span className="rounded-full bg-surface-hover px-1.5 text-xs text-muted-2">{lista.length}</span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-2 hover:bg-surface-hover hover:text-foreground"
            aria-label="Chiudi pannello"
          >
            <PanelRightClose size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {lista.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted-2">Nessuna ricerca ancora.</p>
        ) : (
          lista.map((v) => (
            <button
              key={v.id}
              onClick={() => onCerca(queryDaVoce(v.testo))}
              className={`block w-full rounded-xl border px-3 py-2.5 text-left transition ${
                queryDaVoce(v.testo) === attivo
                  ? "border-primary/50 bg-primary-soft/50"
                  : "border-border bg-surface hover:bg-surface-hover"
              }`}
            >
              <div className="mb-1">
                <Badge tone="gray">{v.tipo}</Badge>
              </div>
              <p className="line-clamp-2 text-sm font-medium">{v.testo}</p>
              <p className="mt-1 text-xs text-muted-2">{formatData(v.createdAt, true)}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/** Versione MOBILE: drawer in overlay sotto l'header, via portal (come le altre sezioni). */
export function RicerchePanelDrawer({
  open,
  attivo,
  onCerca,
  onClose,
}: {
  open: boolean;
  attivo?: string;
  onCerca: (q: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    <div className="fixed inset-x-0 bottom-0 top-16 z-40 lg:hidden">
      <div className="absolute inset-0 animate-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute bottom-0 right-0 top-0 flex w-[86%] max-w-sm flex-col border-l border-border bg-surface p-4 shadow-[var(--shadow-pop)] animate-in">
        <RicerchePanel
          attivo={attivo}
          onCerca={(q) => {
            onCerca(q);
            onClose();
          }}
          onClose={onClose}
        />
      </aside>
    </div>,
    document.body,
  );
}
