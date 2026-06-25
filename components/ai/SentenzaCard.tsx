"use client";

import { useState } from "react";
import type { SentenzaRisultato } from "@/lib/types";
import { Badge } from "@/components/ui";
import { Star, ChevronDown } from "lucide-react";

/** Card di una sentenza: estremi, nota di pertinenza, stella preferiti, testo integrale espandibile. */
export function SentenzaCard({
  s,
  fav,
  onFav,
}: {
  s: SentenzaRisultato;
  fav: boolean;
  onFav: () => void;
}) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{s.estremi}</p>
          {s.materia && <Badge tone="blue" className="mt-1">{s.materia}</Badge>}
        </div>
        <button
          onClick={onFav}
          className={`shrink-0 rounded-lg p-1.5 transition ${fav ? "text-amber-500" : "text-muted-2 hover:text-amber-500"}`}
          aria-label="Salva nei preferiti"
        >
          <Star size={16} fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      {s.nota && (
        <p className="mt-2 rounded-md bg-primary-soft px-2.5 py-1.5 text-xs text-primary">
          <span className="font-semibold">Perché è pertinente:</span> {s.nota}
        </p>
      )}
      {s.massima && <p className="mt-2 text-sm leading-relaxed text-foreground/90">{s.massima}</p>}
      {s.testoCompleto && (
        <div className="mt-2">
          <button
            onClick={() => setAperta((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ChevronDown size={14} className={`transition ${aperta ? "rotate-180" : ""}`} />{" "}
            {aperta ? "Nascondi" : "Testo integrale"}
          </button>
          {aperta && (
            <p className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface p-3 text-xs leading-relaxed text-foreground/80">
              {s.testoCompleto}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
