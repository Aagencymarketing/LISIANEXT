"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  cercaSentenze,
  cercaSentenzePerEstremi,
  SENTENZE_COLLEGATO,
} from "@/lib/ai/sentenze";
import { nomeCliente, type SentenzaRisultato } from "@/lib/types";
import { Badge } from "@/components/ui";
import { AiPanelOpenButton } from "@/components/ai/AiPanelOpenButton";
import { RicerchePanel, RicerchePanelDrawer } from "@/components/ai/RicerchePanel";
import { Search, Star, Database, Loader2, SlidersHorizontal, ChevronDown, Link2, FolderPlus, Check } from "lucide-react";

const ESEMPI = [
  "La clausola risolutiva di un contratto rientra tra quelle vessatorie ex art. 1341 c.c.?",
  "È un elemento riconciliativo valutabile dal Giudice il ripristino della coabitazione tra coniugi separati?",
  "Sono inefficaci i pagamenti compiuti dal fallito dopo la dichiarazione di fallimento?",
];

type Modo = "testo" | "estremi";

function Ricerche() {
  const params = useSearchParams();
  const addCronologia = useApp((s) => s.addCronologia);
  const preferiti = useApp((s) => s.preferiti);
  const togglePreferito = useApp((s) => s.togglePreferito);
  const clienti = useApp((s) => s.clienti);
  const sentenzeCliente = useApp((s) => s.sentenzeCliente);
  const addSentenzaCliente = useApp((s) => s.addSentenzaCliente);
  const aiPanelOpen = useApp((s) => s.aiPanelOpen);
  const toggleAiPanel = useApp((s) => s.toggleAiPanel);

  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [modo, setModo] = useState<Modo>("testo");
  const [q, setQ] = useState("");
  const [estremi, setEstremi] = useState({ number: "", year: "", place: "", issuer: "" });
  const [risultati, setRisultati] = useState<SentenzaRisultato[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const cerca = async (testo: string) => {
    const t = testo.trim();
    if (!t) return;
    setQ(t);
    setModo("testo");
    setLoading(true);
    setRisultati(null);
    setErrore(null);
    addCronologia({ testo: t, tipo: "Sentenze" });
    try {
      setRisultati(await cercaSentenze(t));
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore nella ricerca");
    }
    setLoading(false);
  };

  const cercaEstremi = async () => {
    const m = {
      number: estremi.number.trim() || undefined,
      year: estremi.year.trim() || undefined,
      place: estremi.place.trim() || undefined,
      issuer: estremi.issuer.trim() || undefined,
    };
    if (!m.number && !m.year && !m.place && !m.issuer) return;
    setLoading(true);
    setRisultati(null);
    setErrore(null);
    addCronologia({ testo: `Estremi: ${[m.number, m.year, m.place, m.issuer].filter(Boolean).join(" ")}`, tipo: "Sentenze" });
    try {
      setRisultati(await cercaSentenzePerEstremi(m));
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore nella ricerca");
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = params.get("q");
    if (init) cerca(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-in">
     <div className="flex gap-5">
      <div className="min-w-0 flex-1">
       {!aiPanelOpen && (
         <div className="mb-3 flex justify-end">
           <AiPanelOpenButton label="Ricerche fatte" onClick={toggleAiPanel} />
         </div>
       )}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Ricerche Legali</h1>
        <p className="mt-1 text-muted">Cerca nella banca dati giurisprudenziale</p>

        {/* Switch modalità */}
        <div className="mx-auto mt-5 flex w-fit gap-1 rounded-xl border border-border bg-surface p-1 text-sm">
          <button
            onClick={() => setModo("testo")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              modo === "testo" ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            <Search size={15} /> Testo libero
          </button>
          <button
            onClick={() => setModo("estremi")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              modo === "estremi" ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            <SlidersHorizontal size={15} /> Per estremi
          </button>
        </div>

        {modo === "testo" ? (
          <form onSubmit={(e) => { e.preventDefault(); cerca(q); }} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca giurisprudenza per argomento o quesito..."
                className="w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button type="submit" className="grid w-14 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover" aria-label="Cerca">
              <Search size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); cercaEstremi(); }} className="mt-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <input value={estremi.number} onChange={(e) => setEstremi({ ...estremi, number: e.target.value })} placeholder="Numero" className="rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-primary" />
              <input value={estremi.year} onChange={(e) => setEstremi({ ...estremi, year: e.target.value })} placeholder="Anno" className="rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-primary" />
              <input value={estremi.place} onChange={(e) => setEstremi({ ...estremi, place: e.target.value })} placeholder="Sede (es. Milano)" className="rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-primary" />
              <input value={estremi.issuer} onChange={(e) => setEstremi({ ...estremi, issuer: e.target.value })} placeholder="Organo (es. Cassazione)" className="rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover">
              <Search size={16} /> Cerca per estremi
            </button>
          </form>
        )}

        {/* Stato collegamento DB esterno */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-2">
          <Database size={13} />
          {SENTENZE_COLLEGATO ? (
            <span>Banca dati reale collegata · 6,5M+ sentenze</span>
          ) : (
            <span>Anteprima demo · il collegamento al database reale (6,5M+ sentenze) sarà attivato a breve</span>
          )}
        </div>

        {/* Collega la ricerca a un cliente: le sentenze salvate finiscono nel suo fascicolo */}
        {clienti.length > 0 && (
          <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm">
            <Link2 size={14} className="text-muted-2" />
            <select
              value={clienteId || ""}
              onChange={(e) => setClienteId(e.target.value || undefined)}
              className="max-w-[220px] bg-transparent text-sm outline-none"
            >
              <option value="">Ricerca non collegata a un cliente</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>Per: {nomeCliente(c)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        {errore && (
          <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{errore}</p>
        )}

        {!risultati && !loading && !errore && modo === "testo" && (
          <div className="space-y-2">
            {ESEMPI.map((e) => (
              <button key={e} onClick={() => cerca(e)} className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-muted transition hover:border-primary/40 hover:bg-surface-hover hover:text-foreground">
                {e}
              </button>
            ))}
            <div className="pt-10 text-center text-muted-2">
              <Search size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-base font-medium text-muted">Inserisci un termine o una frase per iniziare</p>
              <p className="text-sm">Cerca tra sentenze di Cassazione, Tribunali, Appello, TAR e molto altro</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted">
            <Loader2 size={20} className="animate-spin" /> Ricerca in corso...
          </div>
        )}

        {risultati && (
          <div className="space-y-3">
            <p className="text-sm text-muted">{risultati.length} risultati{q && modo === "testo" ? <> per <span className="font-medium text-foreground">“{q}”</span></> : null}</p>
            {risultati.length === 0 && (
              <p className="py-10 text-center text-muted-2">Nessuna sentenza trovata. Prova a modificare i termini di ricerca.</p>
            )}
            {risultati.map((s) => (
              <RisultatoCard
                key={s.id}
                s={s}
                fav={preferiti.some((p) => p.id === s.id)}
                onFav={() => togglePreferito(s)}
                clienteNomeSel={clienteId ? nomeCliente(clienti.find((c) => c.id === clienteId)!) : undefined}
                salvata={!!clienteId && sentenzeCliente.some((x) => x.clienteId === clienteId && x.sentenza.id === s.id)}
                onSalvaCliente={clienteId ? () => addSentenzaCliente(clienteId, s) : undefined}
              />
            ))}
          </div>
        )}
      </div>
      </div>

      {aiPanelOpen && (
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="card sticky top-4 flex max-h-[calc(100dvh-9rem)] flex-col p-4">
            <RicerchePanel attivo={q} onCerca={cerca} onClose={toggleAiPanel} />
          </div>
        </aside>
      )}
     </div>

     <RicerchePanelDrawer open={aiPanelOpen} attivo={q} onCerca={cerca} onClose={toggleAiPanel} />
    </div>
  );
}

function RisultatoCard({
  s,
  fav,
  onFav,
  clienteNomeSel,
  salvata,
  onSalvaCliente,
}: {
  s: SentenzaRisultato;
  fav: boolean;
  onFav: () => void;
  clienteNomeSel?: string;
  salvata?: boolean;
  onSalvaCliente?: () => void;
}) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-primary">{s.estremi}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-2">
            {s.materia && <Badge tone="blue">{s.materia}</Badge>}
            {s.fonte && <span>{s.fonte}</span>}
            {s.rilevanza > 0 && (<><span>·</span><span>rilevanza {Math.round(s.rilevanza * 100)}%</span></>)}
          </div>
        </div>
        <button onClick={onFav} className={`shrink-0 rounded-lg p-2 transition ${fav ? "text-amber-500" : "text-muted-2 hover:text-amber-500"}`} aria-label="Preferito">
          <Star size={18} fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      {onSalvaCliente && (
        <button
          onClick={onSalvaCliente}
          disabled={salvata}
          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            salvata ? "text-success" : "bg-primary-soft text-primary hover:bg-primary-soft/70"
          }`}
        >
          {salvata ? <><Check size={14} /> Salvata nel fascicolo di {clienteNomeSel}</> : <><FolderPlus size={14} /> Salva nel fascicolo di {clienteNomeSel}</>}
        </button>
      )}
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{s.massima}</p>
      {s.testoCompleto && (
        <div className="mt-3 border-t border-border pt-3">
          <button onClick={() => setAperta((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ChevronDown size={15} className={`transition ${aperta ? "rotate-180" : ""}`} /> {aperta ? "Nascondi" : "Testo integrale"}
          </button>
          {aperta && (
            <p className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-foreground/80">
              {s.testoCompleto}
            </p>
          )}
        </div>
      )}
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
