"use client";

import { useState } from "react";
import type { ConversazioneAI, ModuloAI } from "@/lib/types";
import { formatData } from "@/lib/utils";
import { Badge, type Tone } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { EsportaButtons } from "@/components/ai/EsportaButtons";
import { ChevronDown, Trash2 } from "lucide-react";

export const BADGE_MODULO: Record<ModuloAI, { label: string; tone: Tone }> = {
  risposta_immediata: { label: "Risposta AI", tone: "blue" },
  pareri: { label: "Parere AI", tone: "violet" },
  redattore: { label: "Atto AI", tone: "amber" },
  ricerche: { label: "Ricerca", tone: "gray" },
};

/** Card espandibile di un elaborato AI: testo integrale + export + elimina. */
export function ElaboratoCard({ c, onElimina }: { c: ConversazioneAI; onElimina: () => void }) {
  const [aperto, setAperto] = useState(false);
  const meta = BADGE_MODULO[c.modulo];
  const contenuto = c.messaggi.find((m) => m.ruolo === "assistente")?.contenuto || "";
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setAperto((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown size={15} className={`shrink-0 text-muted-2 transition ${aperto ? "rotate-180" : ""}`} />
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.titolo}</span>
          <span className="shrink-0 text-xs text-muted-2">{formatData(c.updatedAt)}</span>
        </button>
        <button onClick={onElimina} className="shrink-0 rounded p-1 text-muted-2 hover:text-danger" aria-label="Elimina elaborato">
          <Trash2 size={14} />
        </button>
      </div>
      {aperto && (
        <div className="border-t border-border p-4">
          <div className="max-h-[60vh] overflow-y-auto">
            <Markdown>{contenuto}</Markdown>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <EsportaButtons titolo={c.titolo} testo={contenuto} />
          </div>
        </div>
      )}
    </div>
  );
}
