"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { trovaPrecedenti } from "@/lib/ai/precedenti";
import { SENTENZE_COLLEGATO } from "@/lib/ai/sentenze";
import { nomeCliente, type SentenzaRisultato } from "@/lib/types";
import { Button, Badge } from "@/components/ui";
import { Scale, Loader2, Star, ChevronDown, Database, FolderPlus, Check } from "lucide-react";

/**
 * Sezione "Precedenti pertinenti": cerca sentenze reali a partire dal testo generato
 * e mostra solo quelle filtrate per pertinenza (con nota). Visibile solo se il DB è collegato.
 */
export function PrecedentiPertinenti({
  testo,
  materia,
  leggera,
  clienteId,
}: {
  testo: string;
  materia?: string;
  leggera?: boolean;
  clienteId?: string;
}) {
  const preferiti = useApp((s) => s.preferiti);
  const togglePreferito = useApp((s) => s.togglePreferito);
  const clienti = useApp((s) => s.clienti);
  const sentenzeCliente = useApp((s) => s.sentenzeCliente);
  const addSentenzaCliente = useApp((s) => s.addSentenzaCliente);
  const clienteSel = clienteId ? clienti.find((c) => c.id === clienteId) : undefined;
  const clienteNomeSel = clienteSel ? nomeCliente(clienteSel) : undefined;
  const [stato, setStato] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [risultati, setRisultati] = useState<SentenzaRisultato[]>([]);
  const [mostraAltre, setMostraAltre] = useState(false);
  const [errore, setErrore] = useState("");

  if (!SENTENZE_COLLEGATO || !testo.trim()) return null;

  // Quante sentenze nel primo blocco ("le più pertinenti"); il resto va nel secondo.
  const PRIMO_BLOCCO = 4;

  const cerca = async () => {
    setStato("loading");
    setErrore("");
    setMostraAltre(false);
    try {
      setRisultati(await trovaPrecedenti(testo, { materia, leggera }));
      setStato("done");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore");
      setStato("error");
    }
  };

  const card = (s: SentenzaRisultato) => (
    <PrecedenteCard
      key={s.id}
      s={s}
      fav={preferiti.some((p) => p.id === s.id)}
      onFav={() => togglePreferito(s)}
      clienteNomeSel={clienteNomeSel}
      salvata={!!clienteId && sentenzeCliente.some((x) => x.clienteId === clienteId && x.sentenza.id === s.id)}
      onSalvaCliente={clienteId ? () => addSentenzaCliente(clienteId, s) : undefined}
    />
  );

  const primi = risultati.slice(0, PRIMO_BLOCCO);
  const altre = risultati.slice(PRIMO_BLOCCO);

  return (
    <div className="mt-4 border-t border-border pt-4">
      {stato === "idle" && (
        <Button variant="soft" size="sm" onClick={cerca}>
          <Scale size={16} /> Trova sentenze pertinenti
        </Button>
      )}

      {stato === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin text-primary" />
          Cerco nella banca dati e filtro le sentenze più pertinenti…
        </div>
      )}

      {stato === "error" && (
        <p className="text-sm text-danger">
          {errore}{" "}
          <button onClick={cerca} className="font-medium underline">Riprova</button>
        </p>
      )}

      {stato === "done" && (
        <div className="space-y-3">
          {risultati.length === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-2">
              <Database size={13} /> Nessuna sentenza realmente pertinente trovata.
            </div>
          ) : (
            <>
              {/* Primo blocco: le più pertinenti */}
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Database size={13} className="text-primary" />
                  Queste sono le sentenze più pertinenti che ho trovato
                </p>
                {primi.map(card)}
              </div>

              {/* Secondo blocco: altre pertinenti (una sola volta) */}
              {altre.length > 0 && !mostraAltre && (
                <Button variant="soft" size="sm" onClick={() => setMostraAltre(true)}>
                  <Scale size={16} /> Trova altre sentenze pertinenti
                </Button>
              )}
              {altre.length > 0 && mostraAltre && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground">Queste sono altre sentenze pertinenti</p>
                  {altre.map(card)}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PrecedenteCard({
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
      {onSalvaCliente && (
        <button
          onClick={onSalvaCliente}
          disabled={salvata}
          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            salvata ? "text-success" : "bg-primary-soft text-primary hover:bg-primary-soft/70"
          }`}
        >
          {salvata ? <><Check size={13} /> Salvata nel fascicolo di {clienteNomeSel}</> : <><FolderPlus size={13} /> Salva nel fascicolo di {clienteNomeSel}</>}
        </button>
      )}
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
