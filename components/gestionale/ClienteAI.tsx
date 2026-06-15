"use client";

import { useState } from "react";
import Link from "next/link";
import type { Cliente, SentenzaRisultato } from "@/lib/types";
import { nomeCliente } from "@/lib/types";
import { cercaSentenze } from "@/lib/ai/sentenze";
import { generaRisposta, streamRisposta } from "@/lib/ai/mock";
import { Markdown } from "@/components/Markdown";
import { Badge, Button, Select } from "@/components/ui";
import { Sparkles, ScanSearch, PenLine, Loader2, Database, Star } from "lucide-react";
import { useApp } from "@/lib/store";

export function ClienteAI({ cliente }: { cliente: Cliente }) {
  const togglePreferito = useApp((s) => s.togglePreferito);
  const preferiti = useApp((s) => s.preferiti);

  const [causaId, setCausaId] = useState(cliente.cause[0]?.id || "");
  const causa = cliente.cause.find((c) => c.id === causaId);

  const [loadingPrec, setLoadingPrec] = useState(false);
  const [precedenti, setPrecedenti] = useState<SentenzaRisultato[] | null>(null);

  const [analisi, setAnalisi] = useState("");
  const [loadingAn, setLoadingAn] = useState(false);

  const trovaPrecedenti = async () => {
    const query = causa?.oggetto || `${nomeCliente(cliente)} ${(cliente.tags || []).join(" ")}`;
    setLoadingPrec(true);
    setPrecedenti(null);
    const r = await cercaSentenze(query);
    setPrecedenti(r.slice(0, 3));
    setLoadingPrec(false);
  };

  const riassumi = async () => {
    setLoadingAn(true);
    setAnalisi("");
    const prompt = causa
      ? `Riassumi la posizione del cliente nella pratica "${causa.oggetto}" e indica la strategia difensiva consigliata.`
      : `Riassumi la posizione complessiva del cliente ${nomeCliente(cliente)} e le priorità operative.`;
    const full = generaRisposta("pareri", prompt, { cliente, causa });
    let acc = "";
    for await (const chunk of streamRisposta(full)) {
      acc += chunk;
      setAnalisi(acc);
    }
    setLoadingAn(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-primary-soft/50 px-5 py-3">
        <Sparkles size={18} className="text-primary" />
        <h3 className="font-semibold">Assistente AI sul cliente</h3>
      </div>

      <div className="space-y-4 p-5">
        {cliente.cause.length > 0 && (
          <Select value={causaId} onChange={(e) => { setCausaId(e.target.value); setPrecedenti(null); setAnalisi(""); }}>
            {cliente.cause.map((c) => (
              <option key={c.id} value={c.id}>{c.oggetto}</option>
            ))}
          </Select>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="soft" onClick={trovaPrecedenti} disabled={loadingPrec}>
            {loadingPrec ? <Loader2 size={16} className="animate-spin" /> : <ScanSearch size={16} />}
            Trova precedenti
          </Button>
          <Button variant="soft" onClick={riassumi} disabled={loadingAn}>
            {loadingAn ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Analizza posizione
          </Button>
          <Link
            href={`/ai/redattore?cliente=${cliente.id}${causa ? `&causa=${causa.id}` : ""}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-soft px-4 text-sm font-medium text-primary transition hover:brightness-95"
          >
            <PenLine size={16} /> Redigi atto
          </Link>
        </div>

        {/* Precedenti dal DB sentenze */}
        {precedenti && (
          <div className="animate-in space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-2">
              <Database size={13} />
              Precedenti suggeriti dal database sentenze (anteprima — DB reale 6,5M+ in fase di collegamento)
            </div>
            {precedenti.map((s) => {
              const fav = preferiti.includes(s.id);
              return (
                <div key={s.id} className="rounded-xl border border-border bg-surface-2 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">{s.estremi}</span>
                    <div className="flex items-center gap-2">
                      <Badge tone="green">{Math.round(s.rilevanza * 100)}%</Badge>
                      <button
                        onClick={() => togglePreferito(s.id)}
                        className={fav ? "text-amber-500" : "text-muted-2 hover:text-amber-500"}
                        aria-label="Preferito"
                      >
                        <Star size={15} fill={fav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/90">{s.massima}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Analisi */}
        {analisi && (
          <div className="animate-in rounded-xl border border-border bg-surface-2 p-4">
            <Markdown>{analisi}</Markdown>
          </div>
        )}

        {!precedenti && !analisi && !loadingPrec && !loadingAn && (
          <p className="text-sm text-muted-2">
            L&apos;AI può cercare sentenze coerenti con la pratica selezionata, analizzare la posizione del
            cliente e generare un atto basato sui dati della pratica.
          </p>
        )}
      </div>
    </div>
  );
}
