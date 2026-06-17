"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAIStream } from "@/components/ai/useAIStream";
import { ContextPicker } from "@/components/ai/ContextPicker";
import { FileDrop } from "@/components/ai/FileDrop";
import { ConversazioniPanel } from "@/components/ai/ConversazioniPanel";
import { Markdown } from "@/components/Markdown";
import { Button, Field, Textarea } from "@/components/ui";
import { uid, uuid, oggi } from "@/lib/utils";
import type { ConversazioneAI } from "@/lib/types";
import { FileSearch, Send, Square, Save, Check, Plus } from "lucide-react";

export default function PareriPage() {
  const clienti = useApp((s) => s.clienti);
  const addCronologia = useApp((s) => s.addCronologia);
  const addAttivita = useApp((s) => s.addAttivita);
  const addConversazione = useApp((s) => s.addConversazione);
  const updateConversazione = useApp((s) => s.updateConversazione);

  const [quesito, setQuesito] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [clienteId, setClienteId] = useState<string>();
  const [causaId, setCausaId] = useState<string>();
  const [salvato, setSalvato] = useState(false);
  const [convId, setConvId] = useState<string>();

  const { output, loading, run, stop, setOutput } = useAIStream("pareri");

  const cliente = clienti.find((c) => c.id === clienteId);
  const causa = cliente?.cause.find((c) => c.id === causaId);

  const genera = async () => {
    if (!quesito.trim()) return;
    setSalvato(false);
    setConvId(undefined);
    addCronologia({ testo: quesito.slice(0, 120), tipo: "Parere" });
    const testo = await run(quesito, { cliente, causa });
    if (testo) {
      const id = uuid();
      setConvId(id);
      const conv: ConversazioneAI = {
        id,
        modulo: "pareri",
        titolo: quesito.slice(0, 90),
        messaggi: [
          { id: uid("m"), ruolo: "utente", contenuto: quesito, createdAt: oggi() },
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

  const salvaNelCliente = () => {
    if (!clienteId) return;
    addAttivita(clienteId, {
      data: oggi(),
      causaId,
      tipo: "atto",
      titolo: "Parere AI",
      descrizione: quesito.slice(0, 140),
    });
    if (convId) updateConversazione(convId, { clienteId, causaId });
    setSalvato(true);
  };

  const nuovo = () => {
    setQuesito("");
    setOutput("");
    setFiles([]);
    setClienteId(undefined);
    setCausaId(undefined);
    setConvId(undefined);
    setSalvato(false);
  };

  const apri = (c: ConversazioneAI) => {
    setQuesito(c.messaggi.find((m) => m.ruolo === "utente")?.contenuto || "");
    setOutput(c.messaggi.find((m) => m.ruolo === "assistente")?.contenuto || "");
    setClienteId(c.clienteId);
    setCausaId(c.causaId);
    setConvId(c.id);
    setSalvato(false);
  };

  return (
    <div className="animate-in">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <FileSearch size={26} />
        </div>
        <h1 className="text-2xl font-bold">Consulente AI</h1>
        <p className="mt-1 text-muted">Pareri legali approfonditi, salvati e riapribili.</p>
      </div>

      <div className="flex gap-5">
        <div className="mx-auto min-w-0 flex-1 space-y-5 lg:mx-0" style={{ maxWidth: "48rem" }}>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Quesito giuridico</span>
              <button onClick={nuovo} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-surface-hover">
                <Plus size={14} /> Nuovo
              </button>
            </div>
            <Textarea
              value={quesito}
              onChange={(e) => setQuesito(e.target.value)}
              rows={5}
              placeholder="Descrivi in dettaglio la fattispecie, le parti coinvolte, gli elementi fattuali rilevanti e il quesito specifico..."
            />

            <div className="mt-5">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Documenti (opzionale)</p>
              <FileDrop files={files} onChange={setFiles} />
            </div>

            <div className="mt-5">
              <ContextPicker
                clienteId={clienteId}
                causaId={causaId}
                onCliente={setClienteId}
                onCausa={setCausaId}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {loading ? (
                <Button variant="secondary" onClick={stop}>
                  <Square size={16} /> Ferma
                </Button>
              ) : (
                <Button onClick={genera} disabled={!quesito.trim()}>
                  <Send size={16} /> Genera parere
                </Button>
              )}
            </div>
          </div>

          {output && (
            <div className="card animate-in p-6">
              <Markdown>{output}</Markdown>
              {!loading && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-success">
                    <Check size={14} /> Salvato automaticamente
                  </span>
                  {clienteId && (
                    <Button variant="soft" onClick={salvaNelCliente} disabled={salvato}>
                      {salvato ? <Check size={16} /> : <Save size={16} />}
                      {salvato ? "Aggiunto allo storico" : "Aggiungi allo storico del cliente"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="hidden w-72 shrink-0 xl:block">
          <div className="card sticky top-4 max-h-[calc(100dvh-9rem)] p-4">
            <ConversazioniPanel
              modulo="pareri"
              titolo="Consulenze"
              attivoId={convId}
              onApri={apri}
              onNuova={nuovo}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
