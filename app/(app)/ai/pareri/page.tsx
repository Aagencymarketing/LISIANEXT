"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useAIStream } from "@/components/ai/useAIStream";
import { ContextPicker } from "@/components/ai/ContextPicker";
import { FileDrop } from "@/components/ai/FileDrop";
import { ConversazioniPanel } from "@/components/ai/ConversazioniPanel";
import { ConversazioniDrawer } from "@/components/ai/ConversazioniDrawer";
import { AiPanelOpenButton } from "@/components/ai/AiPanelOpenButton";
import { Elaborando } from "@/components/ai/Elaborando";
import { EsportaButtons } from "@/components/ai/EsportaButtons";
import { VarianteParereSelect } from "@/components/ai/VarianteParereSelect";
import { PrecedentiPertinenti } from "@/components/ai/PrecedentiPertinenti";
import { SentenzeCitate } from "@/components/ai/SentenzeCitate";
import { Markdown } from "@/components/Markdown";
import { Button, Textarea } from "@/components/ui";
import { fileToInline, type VarianteParere } from "@/lib/ai/client";
import { nomeCliente, type ConversazioneAI } from "@/lib/types";
import { uid, uuid, oggi } from "@/lib/utils";
import { FileSearch, Send, Square, Check, Plus, User, Copy, FolderOpen } from "lucide-react";

function PareriInner() {
  const params = useSearchParams();
  const clienti = useApp((s) => s.clienti);
  const conversazioni = useApp((s) => s.conversazioni);
  const addCronologia = useApp((s) => s.addCronologia);
  const addConversazione = useApp((s) => s.addConversazione);
  const updateConversazione = useApp((s) => s.updateConversazione);
  const aiPanelOpen = useApp((s) => s.aiPanelOpen);
  const toggleAiPanel = useApp((s) => s.toggleAiPanel);

  const [quesito, setQuesito] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [clienteId, setClienteId] = useState<string>();
  const [causaId, setCausaId] = useState<string>();
  const [usaFascicolo, setUsaFascicolo] = useState(false);
  const [convId, setConvId] = useState<string>();
  const [copiato, setCopiato] = useState(false);
  const [variante, setVariante] = useState<VarianteParere>("completo");

  const { output, loading, run, stop, setOutput } = useAIStream("pareri");

  const copia = async () => {
    await navigator.clipboard?.writeText(output);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 1500);
  };

  const cliente = clienti.find((c) => c.id === clienteId);
  const causa = cliente?.cause.find((c) => c.id === causaId);

  // Documenti del fascicolo del cliente (già caricati nel gestionale) leggibili
  // dall'AI; se è selezionata una pratica, solo quelli della pratica.
  const ANALIZZABILI = ["pdf", "png", "jpg", "jpeg", "webp", "gif", "txt"];
  const docFascicolo = (cliente?.documenti ?? []).filter(
    (d) =>
      d.storagePath &&
      ANALIZZABILI.includes(d.estensione.toLowerCase()) &&
      (!causaId || d.causaId === causaId),
  );

  // Cambia cliente/causa e mantiene sincronizzato il parere già salvato
  const setCliente = (id?: string) => {
    setClienteId(id);
    setCausaId(undefined);
    setUsaFascicolo(false);
    if (convId) updateConversazione(convId, { clienteId: id, causaId: undefined });
  };
  const setCausa = (id?: string) => {
    setCausaId(id);
    if (convId) updateConversazione(convId, { causaId: id });
  };

  const genera = async () => {
    if (!quesito.trim()) return;
    setConvId(undefined);
    const documentiInline = files.length ? await Promise.all(files.map(fileToInline)) : undefined;
    const documenti =
      usaFascicolo && docFascicolo.length
        ? docFascicolo.map((d) => ({ path: d.storagePath!, nome: `${d.nome}.${d.estensione}`, estensione: d.estensione }))
        : undefined;
    const testo = await run(quesito, { cliente, causa }, { variante, documentiInline, documenti });
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
      addCronologia({ testo: quesito.slice(0, 120), tipo: "Parere", convId: id, modulo: "pareri" });
    }
  };

  // Apertura diretta di un parere salvato (da Cronologia / Home: ?apri=<id>)
  const aperturaRef = useRef<string | null>(null);
  useEffect(() => {
    const id = params.get("apri");
    if (!id || aperturaRef.current === id) return;
    const conv = conversazioni.find((c) => c.id === id && c.modulo === "pareri");
    if (conv) {
      aperturaRef.current = id;
      apri(conv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, conversazioni]);

  const nuovo = () => {
    setQuesito("");
    setOutput("");
    setFiles([]);
    setClienteId(undefined);
    setCausaId(undefined);
    setUsaFascicolo(false);
    setConvId(undefined);
  };

  const apri = (c: ConversazioneAI) => {
    setQuesito(c.messaggi.find((m) => m.ruolo === "utente")?.contenuto || "");
    setOutput(c.messaggi.find((m) => m.ruolo === "assistente")?.contenuto || "");
    setClienteId(c.clienteId);
    setCausaId(c.causaId);
    setConvId(c.id);
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
        <div className="min-w-0 flex-1">
         {!aiPanelOpen && (
           <div className="mb-3 flex justify-end">
             <AiPanelOpenButton label="Pareri fatti" onClick={toggleAiPanel} />
           </div>
         )}
         <div className="mx-auto w-full max-w-3xl space-y-5">
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
              <VarianteParereSelect value={variante} onChange={setVariante} />
            </div>

            <div className="mt-5">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Documenti (opzionale)</p>
              <FileDrop files={files} onChange={setFiles} />
              <p className="mt-1.5 text-xs text-muted-2">
                I documenti allegati (PDF, immagini, TXT) vengono letti dall&apos;AI e usati per un parere più preciso.
              </p>
            </div>

            <div className="mt-5">
              <ContextPicker
                clienteId={clienteId}
                causaId={causaId}
                onCliente={setCliente}
                onCausa={setCausa}
              />
              {/* Carica i documenti già presenti nel fascicolo del cliente/pratica */}
              {cliente && docFascicolo.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUsaFascicolo((v) => !v)}
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    usaFascicolo
                      ? "border-primary/50 bg-primary-soft text-primary"
                      : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {usaFascicolo ? <Check size={14} /> : <FolderOpen size={14} />}
                  {usaFascicolo
                    ? `Documenti del fascicolo inclusi (${docFascicolo.length})`
                    : `Carica i documenti del fascicolo (${docFascicolo.length})`}
                </button>
              )}
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

          {loading && !output && <Elaborando label="Sto elaborando il parere…" />}

          {output && (
            <div className="card animate-in p-6">
              <Markdown>{output}</Markdown>
              {!loading && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-success">
                    <Check size={14} /> Salvato in Pareri
                  </span>
                  {cliente && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2 py-1 text-primary">
                      <User size={13} /> Collegato a {nomeCliente(cliente)} · visibile nello storico
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={copia}>
                      {copiato ? <Check size={16} /> : <Copy size={16} />}
                      {copiato ? "Copiato" : "Copia"}
                    </Button>
                    <EsportaButtons titolo={quesito.trim() || "Parere"} testo={output} />
                  </div>
                </div>
              )}
              {!loading && <SentenzeCitate testo={output} />}
              {!loading && (
                <PrecedentiPertinenti testo={output} materia={causa?.materia} etichetta="Trova altre sentenze" />
              )}
            </div>
          )}
         </div>
        </div>

        {aiPanelOpen && (
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="card sticky top-4 flex max-h-[calc(100dvh-9rem)] flex-col p-4">
              <ConversazioniPanel
                modulo="pareri"
                titolo="Pareri fatti"
                attivoId={convId}
                onApri={apri}
                onNuova={nuovo}
                onClose={toggleAiPanel}
              />
            </div>
          </aside>
        )}
      </div>

      <ConversazioniDrawer
        open={aiPanelOpen}
        modulo="pareri"
        titolo="Pareri fatti"
        attivoId={convId}
        onApri={apri}
        onNuova={nuovo}
        onClose={toggleAiPanel}
      />
    </div>
  );
}

export default function PareriPage() {
  return (
    <Suspense fallback={null}>
      <PareriInner />
    </Suspense>
  );
}
