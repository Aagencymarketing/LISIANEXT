"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useAIStream } from "@/components/ai/useAIStream";
import { ContextPicker } from "@/components/ai/ContextPicker";
import { FileDrop } from "@/components/ai/FileDrop";
import { Markdown } from "@/components/Markdown";
import { Button, Field, Textarea, Select } from "@/components/ui";
import { TIPI_ATTO } from "@/lib/labels";
import { oggi } from "@/lib/utils";
import { PenLine, Sparkles, Square, Save, Check, Copy } from "lucide-react";

function Redattore() {
  const params = useSearchParams();
  const clienti = useApp((s) => s.clienti);
  const addCronologia = useApp((s) => s.addCronologia);
  const addAttivita = useApp((s) => s.addAttivita);

  const [tipoAtto, setTipoAtto] = useState<string>(TIPI_ATTO[0]);
  const [oggetto, setOggetto] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [clienteId, setClienteId] = useState<string | undefined>(params.get("cliente") || undefined);
  const [causaId, setCausaId] = useState<string | undefined>(params.get("causa") || undefined);
  const [salvato, setSalvato] = useState(false);
  const [copiato, setCopiato] = useState(false);

  const { output, loading, run, stop } = useAIStream("redattore");

  const cliente = clienti.find((c) => c.id === clienteId);
  const causa = cliente?.cause.find((c) => c.id === causaId);

  // Prefill oggetto se arriva da una pratica
  useEffect(() => {
    if (causa && !oggetto) {
      setOggetto(
        `Pratica: ${causa.oggetto}. Controparte: ${causa.controparte || "—"}. Foro: ${causa.foro || "—"}.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [causaId]);

  const genera = () => {
    if (!oggetto.trim()) return;
    setSalvato(false);
    addCronologia({ testo: `${tipoAtto} — ${oggetto.slice(0, 80)}`, tipo: "Atto" });
    run(oggetto, { cliente, causa, tipoAtto });
  };

  const salvaNelCliente = () => {
    if (!clienteId) return;
    addAttivita(clienteId, {
      data: oggi(),
      causaId,
      tipo: "atto",
      titolo: `Bozza atto: ${tipoAtto}`,
      descrizione: oggetto.slice(0, 140),
    });
    setSalvato(true);
  };

  const copia = async () => {
    await navigator.clipboard?.writeText(output);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 1500);
  };

  return (
    <div className="animate-in">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <PenLine size={26} />
        </div>
        <h1 className="text-2xl font-bold">Editor AI</h1>
        <p className="mt-1 text-muted">Bozze di atti e memorie su misura, pronte per la revisione finale.</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-5">
        <div className="card p-5">
          <Field label="Tipo di atto">
            <Select value={tipoAtto} onChange={(e) => setTipoAtto(e.target.value)}>
              {TIPI_ATTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

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
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="secondary" onClick={copia}>
                  {copiato ? <Check size={16} /> : <Copy size={16} />}
                  {copiato ? "Copiato" : "Copia testo"}
                </Button>
                {clienteId && (
                  <Button variant="soft" onClick={salvaNelCliente} disabled={salvato}>
                    {salvato ? <Check size={16} /> : <Save size={16} />}
                    {salvato ? "Salvato nella pratica" : "Salva nella pratica del cliente"}
                  </Button>
                )}
              </div>
            )}
          </div>
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
