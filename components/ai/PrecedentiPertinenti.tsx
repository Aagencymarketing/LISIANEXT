"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { trovaPrecedenti } from "@/lib/ai/precedenti";
import { SENTENZE_COLLEGATO } from "@/lib/ai/sentenze";
import type { SentenzaRisultato } from "@/lib/types";
import { Button, Badge } from "@/components/ui";
import { Scale, Loader2, Star, ChevronDown, Database } from "lucide-react";

/**
 * Sezione "Precedenti pertinenti": cerca sentenze reali a partire dal testo generato
 * e mostra solo quelle filtrate per pertinenza (con nota). Visibile solo se il DB è collegato.
 */
export function PrecedentiPertinenti({
  testo,
  materia,
  leggera,
}: {
  testo: string;
  materia?: string;
  leggera?: boolean;
}) {
  const preferiti = useApp((s) => s.preferiti);
  const togglePreferito = useApp((s) => s.togglePreferito);
  const [stato, setStato] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [risultati, setRisultati] = useState<SentenzaRisultato[]>([]);
  const [errore, setErrore] = useState("");

  if (!SENTENZE_COLLEGATO || !testo.trim()) return null;

  const cerca = async () => {
    setStato("loading");
    setErrore("");
    try {
      setRisultati(await trovaPrecedenti(testo, { materia, leggera }));
      setStato("done");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore");
      setStato("error");
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      {stato === "idle" && (
        <Button variant="soft" size="sm" onClick={cerca}>
          <Scale size={16} /> Trova precedenti pertinenti
        </Button>
      )}

      {stato === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin text-primary" />
          Cerco nella banca dati e filtro i precedenti più pertinenti…
        </div>
      )}

      {stato === "error" && (
        <p className="text-sm text-danger">
          {errore}{" "}
          <button onClick={cerca} className="font-medium underline">Riprova</button>
        </p>
      )}

      {stato === "done" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-2">
            <Database size={13} />
            {risultati.length > 0
              ? `${risultati.length} precedenti pertinenti dalla banca dati reale`
              : "Nessun precedente realmente pertinente trovato."}
          </div>
          {risultati.map((s) => (
            <PrecedenteCard key={s.id} s={s} fav={preferiti.some((p) => p.id === s.id)} onFav={() => togglePreferito(s)} />
          ))}
          {risultati.length > 0 && (
            <button onClick={cerca} className="text-xs font-medium text-primary hover:underline">
              Aggiorna ricerca
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PrecedenteCard({ s, fav, onFav }: { s: SentenzaRisultato; fav: boolean; onFav: () => void }) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{s.estremi}</p>
          {s.materia && <Badge tone="blue" className="mt-1">{s.materia}</Badge>}
        </div>
        <button onClick={onFav} className={`shrink-0 rounded-lg p-1.5 transition ${fav ? "text-amber-500" : "text-muted-2 hover:text-amber-500"}`} aria-label="Salva nei preferiti">
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
          <button onClick={() => setAperta((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <ChevronDown size={14} className={`transition ${aperta ? "rotate-180" : ""}`} /> {aperta ? "Nascondi" : "Testo integrale"}
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
