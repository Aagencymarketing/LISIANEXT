"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { cercaSentenze, SENTENZE_COLLEGATO } from "@/lib/ai/sentenze";
import type { SentenzaRisultato } from "@/lib/types";
import { Badge } from "@/components/ui";
import { Search, Star, Database, Loader2 } from "lucide-react";

const ESEMPI = [
  "La clausola risolutiva di un contratto rientra tra quelle vessatorie ex art. 1341 c.c.?",
  "È un elemento riconciliativo valutabile dal Giudice il ripristino della coabitazione tra coniugi separati?",
  "Sono inefficaci i pagamenti compiuti dal fallito dopo la dichiarazione di fallimento?",
];

function Ricerche() {
  const params = useSearchParams();
  const addCronologia = useApp((s) => s.addCronologia);
  const preferiti = useApp((s) => s.preferiti);
  const togglePreferito = useApp((s) => s.togglePreferito);

  const [q, setQ] = useState("");
  const [risultati, setRisultati] = useState<SentenzaRisultato[] | null>(null);
  const [loading, setLoading] = useState(false);

  const cerca = async (testo: string) => {
    const t = testo.trim();
    if (!t) return;
    setQ(t);
    setLoading(true);
    setRisultati(null);
    addCronologia({ testo: t, tipo: "Sentenze" });
    const r = await cercaSentenze(t);
    setRisultati(r);
    setLoading(false);
  };

  useEffect(() => {
    const init = params.get("q");
    if (init) cerca(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-in">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Ricerche Legali</h1>
        <p className="mt-1 text-muted">Cerca nella banca dati giurisprudenziale</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            cerca(q);
          }}
          className="mt-6 flex gap-2"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca giurisprudenza..."
              className="w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <button
            type="submit"
            className="grid w-14 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover"
            aria-label="Cerca"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Stato collegamento DB esterno */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-2">
          <Database size={13} />
          {SENTENZE_COLLEGATO ? (
            <span>Banca dati collegata · aggiornata ogni 24h</span>
          ) : (
            <span>
              Anteprima demo · il collegamento al database reale (6,5M+ sentenze) sarà attivato in fase di integrazione
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        {!risultati && !loading && (
          <div className="space-y-2">
            {ESEMPI.map((e) => (
              <button
                key={e}
                onClick={() => cerca(e)}
                className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-muted transition hover:border-primary/40 hover:bg-surface-hover hover:text-foreground"
              >
                {e}
              </button>
            ))}
            <div className="pt-10 text-center text-muted-2">
              <Search size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-base font-medium text-muted">Inserisci un termine o una frase per iniziare</p>
              <p className="text-sm">Cerca tra sentenze di Cassazione, Tribunali, Appello e molto altro</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted">
            <Loader2 size={20} className="animate-spin" />
            Ricerca in corso...
          </div>
        )}

        {risultati && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {risultati.length} risultati per <span className="font-medium text-foreground">“{q}”</span>
            </p>
            {risultati.map((s) => {
              const fav = preferiti.includes(s.id);
              return (
                <div key={s.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-primary">{s.estremi}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-2">
                        <Badge tone="blue">{s.materia}</Badge>
                        <span>{s.fonte}</span>
                        <span>·</span>
                        <span>{s.data}</span>
                        <span>·</span>
                        <span>rilevanza {Math.round(s.rilevanza * 100)}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePreferito(s.id)}
                      className={`shrink-0 rounded-lg p-2 transition ${
                        fav ? "text-amber-500" : "text-muted-2 hover:text-amber-500"
                      }`}
                      aria-label="Preferito"
                    >
                      <Star size={18} fill={fav ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{s.massima}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Ricerche />
    </Suspense>
  );
}
