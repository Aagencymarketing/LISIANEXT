"use client";

import { useApp } from "@/lib/store";
import { nomeCliente, type ConversazioneAI, type ModuloAI } from "@/lib/types";
import { formatData } from "@/lib/utils";
import { MessageSquare, Trash2, Plus, User, PanelRightClose } from "lucide-react";
import { Badge, type Tone } from "@/components/ui";

const TIPO_MODULO: Record<ModuloAI, { label: string; tone: Tone }> = {
  risposta_immediata: { label: "Risposta", tone: "blue" },
  pareri: { label: "Parere", tone: "violet" },
  redattore: { label: "Atto", tone: "amber" },
  ricerche: { label: "Ricerca", tone: "gray" },
};

export function ConversazioniPanel({
  modulo,
  attivoId,
  onApri,
  onNuova,
  onClose,
  titolo = "Salvati",
}: {
  modulo: ModuloAI;
  attivoId?: string;
  onApri: (c: ConversazioneAI) => void;
  onNuova?: () => void;
  onClose?: () => void;
  titolo?: string;
}) {
  const conversazioni = useApp((s) => s.conversazioni);
  const clienti = useApp((s) => s.clienti);
  const removeConversazione = useApp((s) => s.removeConversazione);

  const lista = conversazioni.filter((c) => c.modulo === modulo);
  const meta = TIPO_MODULO[modulo];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare size={16} className="text-primary" />
          {titolo}
          <span className="rounded-full bg-surface-hover px-1.5 text-xs text-muted-2">
            {lista.length}
          </span>
        </h3>
        <div className="flex items-center gap-1">
          {onNuova && (
            <button
              onClick={onNuova}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-surface-hover"
            >
              <Plus size={14} /> Nuova
            </button>
          )}
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
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {lista.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted-2">
            Nessun elemento salvato.
          </p>
        ) : (
          lista.map((c) => {
            const cliente = c.clienteId
              ? clienti.find((cl) => cl.id === c.clienteId)
              : undefined;
            return (
              <div
                key={c.id}
                className={`group cursor-pointer rounded-xl border px-3 py-2.5 transition ${
                  c.id === attivoId
                    ? "border-primary/50 bg-primary-soft/50"
                    : "border-border bg-surface hover:bg-surface-hover"
                }`}
                onClick={() => onApri(c)}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConversazione(c.id);
                    }}
                    className="shrink-0 text-muted-2 opacity-0 transition group-hover:opacity-100 hover:text-danger"
                    aria-label="Elimina"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="line-clamp-2 text-sm font-medium">{c.titolo}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-2">
                  <span>{formatData(c.updatedAt, true)}</span>
                  {cliente && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-1.5 py-0.5 text-primary">
                      <User size={11} /> {nomeCliente(cliente)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
