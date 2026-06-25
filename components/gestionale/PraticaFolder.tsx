"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { Cliente, Causa } from "@/lib/types";
import { STATO_CAUSA, MATERIA_CAUSA } from "@/lib/labels";
import { formatData, formatEuro } from "@/lib/utils";
import { Badge, Button, Select } from "@/components/ui";
import { ElaboratoCard } from "@/components/gestionale/ElaboratoCard";
import {
  ChevronDown, Sparkles, FileText, Download, Trash2, FolderOpen,
  Scale, CalendarClock, Gavel,
} from "lucide-react";

export function PraticaFolder({
  cliente,
  causa,
  onAnalizza,
  onScaricaDoc,
  onEliminaDoc,
}: {
  cliente: Cliente;
  causa: Causa;
  onAnalizza: (causaId: string) => void;
  onScaricaDoc: (storagePath?: string) => void;
  onEliminaDoc: (docId: string, storagePath?: string) => void;
}) {
  const conversazioni = useApp((s) => s.conversazioni);
  const removeConversazione = useApp((s) => s.removeConversazione);
  const updateConversazione = useApp((s) => s.updateConversazione);
  const updateDocumento = useApp((s) => s.updateDocumento);
  const sentenzeCliente = useApp((s) => s.sentenzeCliente);
  const removeSentenzaCliente = useApp((s) => s.removeSentenzaCliente);
  const updateCausa = useApp((s) => s.updateCausa);
  const removeCausa = useApp((s) => s.removeCausa);
  const [aperta, setAperta] = useState(false);

  // Elenco pratiche per spostare elaborati/documenti tra pratiche del cliente.
  const pratiche = cliente.cause.map((ca) => ({ id: ca.id, oggetto: ca.oggetto }));

  const elaborati = conversazioni.filter((c) => c.causaId === causa.id);
  const documenti = cliente.documenti.filter((d) => d.causaId === causa.id);
  const sentenze = sentenzeCliente.filter((x) => x.clienteId === cliente.id && x.causaId === causa.id);
  const attivita = cliente.attivita
    .filter((a) => a.causaId === causa.id)
    .sort((a, b) => +new Date(b.data) - +new Date(a.data));

  return (
    <div className="card overflow-hidden">
      {/* Header sottocartella */}
      <div className="flex items-start justify-between gap-3 p-5">
        <button onClick={() => setAperta((v) => !v)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <FolderOpen size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 font-semibold">
              <ChevronDown size={16} className={`shrink-0 text-muted-2 transition ${aperta ? "rotate-180" : ""}`} />
              {causa.oggetto}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-2">
              <Badge tone={STATO_CAUSA[causa.stato].tone}>{STATO_CAUSA[causa.stato].label}</Badge>
              <Badge tone="blue">{MATERIA_CAUSA[causa.materia]}</Badge>
              {causa.controparte && <span>c. {causa.controparte}</span>}
              <span>· {elaborati.length} elaborati · {documenti.length} documenti{sentenze.length > 0 ? ` · ${sentenze.length} sentenze` : ""}</span>
            </div>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={causa.stato}
            onChange={(e) => updateCausa(cliente.id, causa.id, { stato: e.target.value as never })}
            className="h-9 w-auto py-1.5 text-xs"
          >
            {Object.entries(STATO_CAUSA).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          <button onClick={() => removeCausa(cliente.id, causa.id)} className="rounded-lg p-2 text-muted-2 hover:text-danger" aria-label="Elimina pratica">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {aperta && (
        <div className="space-y-5 border-t border-border bg-surface-2/40 p-5">
          {/* Dati pratica + azioni */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onAnalizza(causa.id)}>
              <Sparkles size={15} /> Analizza ed esegui
            </Button>
            <Link href={`/ai/redattore?cliente=${cliente.id}&causa=${causa.id}`}>
              <Button variant="soft" size="sm"><Gavel size={15} /> Redigi atto</Button>
            </Link>
            {/* Collega un lavoro AI esistente (di questo cliente) a questa pratica */}
            {conversazioni.some((c) => c.clienteId === cliente.id && c.causaId !== causa.id) && (
              <Select
                value=""
                onChange={(e) => e.target.value && updateConversazione(e.target.value, { causaId: causa.id })}
                className="h-9 w-auto max-w-[190px] py-1.5 text-xs"
                aria-label="Collega un lavoro esistente"
              >
                <option value="">+ Collega lavoro esistente</option>
                {conversazioni
                  .filter((c) => c.clienteId === cliente.id && c.causaId !== causa.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.titolo}</option>
                  ))}
              </Select>
            )}
            {/* Collega un documento esistente a questa pratica */}
            {cliente.documenti.some((d) => d.causaId !== causa.id) && (
              <Select
                value=""
                onChange={(e) => e.target.value && updateDocumento(cliente.id, e.target.value, { causaId: causa.id })}
                className="h-9 w-auto max-w-[190px] py-1.5 text-xs"
                aria-label="Collega un documento esistente"
              >
                <option value="">+ Collega documento esistente</option>
                {cliente.documenti
                  .filter((d) => d.causaId !== causa.id)
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.nome}.{d.estensione}</option>
                  ))}
              </Select>
            )}
            {causa.prossimaUdienza && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-2">
                <CalendarClock size={13} /> Prossima udienza {formatData(causa.prossimaUdienza)}
              </span>
            )}
            {causa.valore != null && (
              <span className="text-xs text-muted-2">Valore {formatEuro(causa.valore)}</span>
            )}
          </div>

          {/* Elaborati AI */}
          <Sezione titolo="Elaborati AI" count={elaborati.length} icona={<Scale size={14} />}>
            {elaborati.length === 0 ? (
              <Vuoto testo="Nessun parere/atto ancora. Usa “Analizza ed esegui”." />
            ) : (
              <div className="space-y-2">
                {elaborati.map((c) => (
                  <ElaboratoCard
                    key={c.id}
                    c={c}
                    onElimina={() => removeConversazione(c.id)}
                    pratiche={pratiche}
                    onCambiaPratica={(causaId) => updateConversazione(c.id, { causaId })}
                  />
                ))}
              </div>
            )}
          </Sezione>

          {/* Documenti */}
          <Sezione titolo="Documenti" count={documenti.length} icona={<FileText size={14} />}>
            {documenti.length === 0 ? (
              <Vuoto testo="Nessun documento collegato a questa pratica." />
            ) : (
              <div className="space-y-1.5">
                {documenti.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                    <FileText size={15} className="text-primary" />
                    <span className="min-w-0 flex-1 truncate">{d.nome}.{d.estensione}</span>
                    {pratiche.length > 0 && (
                      <Select
                        value={d.causaId || ""}
                        onChange={(e) => updateDocumento(cliente.id, d.id, { causaId: e.target.value || undefined })}
                        className="h-8 w-auto max-w-[150px] py-1 text-xs"
                        aria-label="Collega a una pratica"
                      >
                        <option value="">Nessuna pratica</option>
                        {pratiche.map((p) => (
                          <option key={p.id} value={p.id}>{p.oggetto}</option>
                        ))}
                      </Select>
                    )}
                    <button onClick={() => onScaricaDoc(d.storagePath)} disabled={!d.storagePath} className="rounded p-1 text-muted-2 hover:text-foreground disabled:opacity-40" aria-label="Scarica"><Download size={15} /></button>
                    <button onClick={() => onEliminaDoc(d.id, d.storagePath)} className="rounded p-1 text-muted-2 hover:text-danger" aria-label="Elimina"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </Sezione>

          {/* Sentenze collegate alla pratica */}
          {sentenze.length > 0 && (
            <Sezione titolo="Sentenze" count={sentenze.length} icona={<Scale size={14} />}>
              <div className="space-y-1.5">
                {sentenze.map((x) => (
                  <div key={x.id} className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                    <Scale size={15} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">{x.sentenza.estremi}</p>
                      {x.sentenza.massima && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{x.sentenza.massima}</p>}
                    </div>
                    <button onClick={() => removeSentenzaCliente(x.id)} className="shrink-0 rounded p-1 text-muted-2 hover:text-danger" aria-label="Rimuovi sentenza">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </Sezione>
          )}

          {/* Attività */}
          {attivita.length > 0 && (
            <Sezione titolo="Attività" count={attivita.length} icona={<CalendarClock size={14} />}>
              <ol className="space-y-2">
                {attivita.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <span className="font-medium">{a.titolo}</span>
                      <span className="ml-2 text-xs text-muted-2">{formatData(a.data, true)}</span>
                      {a.descrizione && <p className="text-xs text-muted">{a.descrizione}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Sezione>
          )}
        </div>
      )}
    </div>
  );
}

function Sezione({ titolo, count, icona, children }: { titolo: string; count: number; icona: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {icona} {titolo} <span className="text-muted-2">({count})</span>
      </p>
      {children}
    </div>
  );
}

function Vuoto({ testo }: { testo: string }) {
  return <p className="text-sm text-muted-2">{testo}</p>;
}
