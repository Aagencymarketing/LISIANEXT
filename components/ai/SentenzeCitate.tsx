"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import {
  trovaSentenzeCitate,
  cercaSentenzaManuale,
  type SentenzaCitata,
} from "@/lib/ai/sentenzeCitate";
import { SENTENZE_COLLEGATO } from "@/lib/ai/sentenze";
import { SentenzaCard } from "./SentenzaCard";
import type { SentenzaRisultato } from "@/lib/types";
import { Button } from "@/components/ui";
import { BookText, Loader2, AlertTriangle, Search } from "lucide-react";

/**
 * Elenco automatico delle sentenze CITATE nel testo del parere/atto: estratte dal
 * testo e agganciate alla banca dati (cliccabili per il testo integrale). Le
 * citazioni non trovate sono segnalate come "Sentenza mancante" con inserimento
 * manuale degli estremi.
 */
export function SentenzeCitate({ testo }: { testo: string }) {
  const preferiti = useApp((s) => s.preferiti);
  const togglePreferito = useApp((s) => s.togglePreferito);
  const [stato, setStato] = useState<"loading" | "done" | "error">("loading");
  const [sentenze, setSentenze] = useState<SentenzaCitata[]>([]);

  useEffect(() => {
    let attivo = true;
    if (!SENTENZE_COLLEGATO || !testo.trim()) {
      setStato("done");
      setSentenze([]);
      return;
    }
    setStato("loading");
    trovaSentenzeCitate(testo)
      .then((r) => {
        if (attivo) {
          setSentenze(r);
          setStato("done");
        }
      })
      .catch(() => {
        if (attivo) setStato("error");
      });
    return () => {
      attivo = false;
    };
  }, [testo]);

  if (!SENTENZE_COLLEGATO || !testo.trim()) return null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <BookText size={14} className="text-primary" /> Sentenze citate nel parere
      </p>

      {stato === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin text-primary" /> Recupero le sentenze citate…
        </div>
      )}
      {stato === "error" && (
        <p className="text-sm text-danger">Non sono riuscito a recuperare le sentenze citate.</p>
      )}
      {stato === "done" && sentenze.length === 0 && (
        <p className="text-sm text-muted-2">Nessuna sentenza citata nel testo.</p>
      )}
      {stato === "done" && sentenze.length > 0 && (
        <div className="space-y-2">
          {sentenze.map((c, i) =>
            c.trovata && c.sentenza ? (
              <SentenzaCard
                key={i}
                s={c.sentenza}
                fav={preferiti.some((p) => p.id === c.sentenza!.id)}
                onFav={() => togglePreferito(c.sentenza!)}
              />
            ) : (
              <SentenzaMancante
                key={i}
                citazione={c.citazione}
                preferiti={preferiti}
                togglePreferito={togglePreferito}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function SentenzaMancante({
  citazione,
  preferiti,
  togglePreferito,
}: {
  citazione: string;
  preferiti: SentenzaRisultato[];
  togglePreferito: (s: SentenzaRisultato) => void;
}) {
  const [q, setQ] = useState(citazione);
  const [cercando, setCercando] = useState(false);
  const [trovata, setTrovata] = useState<SentenzaRisultato | undefined>();
  const [niente, setNiente] = useState(false);

  const cerca = async () => {
    setCercando(true);
    setNiente(false);
    try {
      const s = await cercaSentenzaManuale(q);
      setTrovata(s);
      setNiente(!s);
    } finally {
      setCercando(false);
    }
  };

  if (trovata) {
    return (
      <SentenzaCard
        s={trovata}
        fav={preferiti.some((p) => p.id === trovata.id)}
        onFav={() => togglePreferito(trovata)}
      />
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-amber-400/60 bg-amber-50/40 p-3.5 dark:bg-amber-500/5">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
        <AlertTriangle size={14} /> Sentenza mancante
      </div>
      <p className="mt-1 text-sm text-foreground/90">{citazione}</p>
      <p className="mt-1 text-xs text-muted-2">
        Non trovata in banca dati. Inserisci o correggi gli estremi e cerca:
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Es. Cass. civ. Sez. II n. 4806/2005"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <Button size="sm" onClick={cerca} disabled={cercando || !q.trim()} className="shrink-0">
          {cercando ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Cerca
        </Button>
      </div>
      {niente && <p className="mt-1.5 text-xs text-muted-2">Nessun risultato per questi estremi.</p>}
    </div>
  );
}
