"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useAIStream } from "@/components/ai/useAIStream";
import { ContextPicker } from "@/components/ai/ContextPicker";
import { FileDrop } from "@/components/ai/FileDrop";
import { ConversazioniPanel } from "@/components/ai/ConversazioniPanel";
import { AiPanelOpenButton } from "@/components/ai/AiPanelOpenButton";
import { Markdown } from "@/components/Markdown";
import { Button, Field, Textarea, Select } from "@/components/ui";
import { TIPI_ATTO } from "@/lib/labels";
import { nomeCliente, type ConversazioneAI } from "@/lib/types";
import { uid, uuid, oggi } from "@/lib/utils";
import { PenLine, Sparkles, Square, Check, Copy, Plus, User } from "lucide-react";

function Redattore() {
  const params = useSearchParams();
  const clienti = useApp((s) => s.clienti);
  const addCronologia = useApp((s) => s.addCronologia);
  const addConversazione = useApp((s) => s.addConversazione);
  const updateConversazione = useApp((s) => s.updateConversazione);
  const aiPanelOpen = useApp((s) => s.aiPanelOpen);
  const toggleAiPanel = useApp((s) => s.toggleAiPanel);

  const [tipoAtto, setTipoAtto] = useState<string>(TIPI_ATTO[0]);
  const [oggetto, setOggetto] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [clienteId, setClienteId] = useState<string | undefined>(params.get("cliente") || undefined);
  const [causaId, setCausaId] = useState<string | undefined>(params.get("causa") || undefined);
  const [copiato, setCopiato] = useState(false);
  const [convId, setConvId] = useState<string>();

  const { output, loading, run, stop, setOutput } = useAIStream("redattore");

  const cliente = clienti.find((c) => c.id === clienteId);
  const causa = cliente?.cause.find((c) => c.id === causaId);

  const setCliente = (id?: string) => {
    setClienteId(id);
    setCausaId(undefined);
    if (convId) updateConversazione(convId, { clienteId: id, causaId: undefined });
  };
  const setCausa = (id?: string) => {
    setCausaId(id);
    if (convId) updateConversazione(convId, { causaId: id });
  };

  // Prefill oggetto se arriva da una pratica
  useEffect(() => {
    if (causa && !oggetto) {
      setOggetto(
        `Pratica: ${causa.oggetto}. Controparte: ${causa.controparte || "—"}. Foro: ${causa.foro || "—"}.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [causaId]);

  const genera = async () => {
    if (!oggetto.trim()) return;
    setConvId(undefined);
    addCronologia({ testo: `${tipoAtto} — ${oggetto.slice(0, 80)}`, tipo: "Atto" });
    const testo = await run(oggetto, { cliente, causa, tipoAtto });
    if (testo) {
      const id = uuid();
      setConvId(id);
      const conv: ConversazioneAI = {
        id,
        modulo: "redattore",
        titolo: `${tipoAtto} — ${oggetto.slice(0, 70)}`,
        messaggi: [
          { id: uid("m"), ruolo: "utente", contenuto: oggetto, createdAt: oggi() },
          { id: uid("m"), ruolo: "assistente", contenuto: testo, createdAt: oggi() },
        ],
        clienteId,
        causaId,
        createdAt: oggi(),
        updatedAt: oggi(),
      };
      addConversazione(conv);
    }
  };

  const copia = async () => {
    await navigator.clipboard?.writeText(output);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 1500);
  };

  const nuovo = () => {
    setOggetto("");
    setOutput("");
    setFiles([]);
    setClienteId(undefined);
    setCausaId(undefined);
    setConvId(undefined);
  };

  const apri = (c: ConversazioneAI) => {
    setOggetto(c.messaggi.find((m) => m.ruolo === "utente")?.contenuto || "");
    setOutput(c.messaggi.find((m) => m.ruolo === "assistente")?.contenuto || "");
    const tipo = TIPI_ATTO.find((t) => c.titolo.startsWith(t));
    if (tipo) setTipoAtto(tipo);
    setClienteId(c.clienteId);
    setCausaId(c.causaId);
    setConvId(c.id);
  };

  return (
    <div className="animate-in">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <PenLine size={26} />
        </div>
        <h1 className="text-2xl font-bold">Editor AI</h1>
        <p className="mt-1 text-muted">Bozze di atti e memorie, salvate e riapribili.</p>
      </div>

      <div className="flex gap-5">
        <div className="min-w-0 flex-1">
         {!aiPanelOpen && (
           <div className="mb-3 flex justify-end">
             <AiPanelOpenButton label="Bozze fatte" onClick={toggleAiPanel} />
           </div>
         )}
         <div className="mx-auto w-full max-w-3xl space-y-5">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Tipo di atto</span>
              <button onClick={nuovo} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-surface-hover">
                <Plus size={14} /> Nuova
              </button>
            </div>
            <Select value={tipoAtto} onChange={(e) => setTipoAtto(e.target.value)}>
              {TIPI_ATTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>

            <div className="mt-5">
              <Field label="Oggetto e istruzioni">
                <Textarea
                  value={oggetto}
                  onChange={(e) => setOggetto(e.target.value)}
                  rows={5}
                  placeholder="Descrivi l'oggetto della causa, le parti, i fatti rilevanti, le richieste e ogni elemento utile alla redazione..."
                />
              </Field>
            </div>

            <div className="mt-5">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                Documenti di riferimento (opzionale)
              </p>
              <FileDrop files={files} onChange={setFiles} />
            </div>

            <div className="mt-5">
              <ContextPicker
                clienteId={clienteId}
                causaId={causaId}
                onCliente={setCliente}
                onCausa={setCausa}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {loading ? (
                <Button variant="secondary" onClick={stop}>
                  <Square size={16} /> Ferma
                </Button>
              ) : (
                <Button onClick={genera} disabled={!oggetto.trim()}>
                  <Sparkles size={16} /> Genera bozza
                </Button>
              )}
            </div>
          </div>

          {output && (
            <div className="card animate-in p-6">
              <div className="prose-sm whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
                <Markdown>{output}</Markdown>
              </div>
              {!loading && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-success">
                    <Check size={14} /> Salvato in Bozze
                  </span>
                  {cliente && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2 py-1 text-xs text-primary">
                      <User size={13} /> Collegato a {nomeCliente(cliente)} · visibile nello storico
                    </span>
                  )}
                  <Button variant="secondary" size="sm" onClick={copia}>
                    {copiato ? <Check size={16} /> : <Copy size={16} />}
                    {copiato ? "Copiato" : "Copia testo"}
                  </Button>
                </div>
              )}
            </div>
          )}
         </div>
        </div>

        {aiPanelOpen && (
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="card sticky top-4 max-h-[calc(100dvh-9rem)] p-4">
              <ConversazioniPanel
                modulo="redattore"
                titolo="Bozze fatte"
                attivoId={convId}
                onApri={apri}
                onNuova={nuovo}
                onClose={toggleAiPanel}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Redattore />
    </Suspense>
  );
}
