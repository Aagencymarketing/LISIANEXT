"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAIStream } from "@/components/ai/useAIStream";
import { ContextPicker } from "@/components/ai/ContextPicker";
import { FileDrop } from "@/components/ai/FileDrop";
import { Markdown } from "@/components/Markdown";
import { Button, Field, Textarea } from "@/components/ui";
import { oggi } from "@/lib/utils";
import { FileSearch, Send, Square, Save, Check } from "lucide-react";

export default function PareriPage() {
  const clienti = useApp((s) => s.clienti);
  const addCronologia = useApp((s) => s.addCronologia);
  const addAttivita = useApp((s) => s.addAttivita);

  const [quesito, setQuesito] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [clienteId, setClienteId] = useState<string>();
  const [causaId, setCausaId] = useState<string>();
  const [salvato, setSalvato] = useState(false);

  const { output, loading, run, stop } = useAIStream("pareri");

  const cliente = clienti.find((c) => c.id === clienteId);
  const causa = cliente?.cause.find((c) => c.id === causaId);

  const genera = () => {
    if (!quesito.trim()) return;
    setSalvato(false);
    addCronologia({ testo: quesito.slice(0, 120), tipo: "Parere" });
    run(quesito, { cliente, causa });
  };

  const salvaNelCliente = () => {
    if (!clienteId) return;
    addAttivita(clienteId, {
      data: oggi(),
      causaId,
      tipo: "atto",
      titolo: "Parere AI generato",
      descrizione: quesito.slice(0, 140),
    });
    setSalvato(true);
  };

  return (
    <div className="animate-in">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <FileSearch size={26} />
        </div>
        <h1 className="text-2xl font-bold">Consulente AI</h1>
        <p className="mt-1 text-muted">Pareri legali approfonditi, eventualmente basati sui documenti che fornisci.</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-5">
        <div className="card p-5">
          <Field label="Quesito giuridico">
            <Textarea
              value={quesito}
              onChange={(e) => setQuesito(e.target.value)}
              rows={5}
              placeholder="Descrivi in dettaglio la fattispecie, le parti coinvolte, gli elementi fattuali rilevanti e il quesito specifico..."
            />
          </Field>

          <div className="mt-5">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Documenti (opzionale)
            </p>
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
            {!loading && clienteId && (
              <div className="mt-5 border-t border-border pt-4">
                <Button variant="soft" onClick={salvaNelCliente} disabled={salvato}>
                  {salvato ? <Check size={16} /> : <Save size={16} />}
                  {salvato ? "Salvato nella pratica" : "Salva nella pratica del cliente"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
