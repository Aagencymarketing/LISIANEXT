"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { streamAI, type DocumentoRef, type VarianteParere } from "@/lib/ai/client";
import { Markdown } from "@/components/Markdown";
import { Elaborando } from "@/components/ai/Elaborando";
import { EsportaButtons } from "@/components/ai/EsportaButtons";
import { VarianteParereSelect } from "@/components/ai/VarianteParereSelect";
import { Modal, Button, Select, Textarea } from "@/components/ui";
import { TIPI_ATTO } from "@/lib/labels";
import { nomeCliente, type Cliente, type ModuloAI, type ConversazioneAI } from "@/lib/types";
import { uid, uuid, oggi } from "@/lib/utils";
import { FileSearch, PenLine, MessageSquare, Square, Check, FileText } from "lucide-react";

const ANALIZZABILI = ["pdf", "png", "jpg", "jpeg", "webp", "gif", "txt"];

const AZIONI: { key: ModuloAI; label: string; icon: typeof FileSearch }[] = [
  { key: "pareri", label: "Parere", icon: FileSearch },
  { key: "redattore", label: "Atto", icon: PenLine },
  { key: "risposta_immediata", label: "Risposta", icon: MessageSquare },
];

export function AnalizzaEsegui({
  cliente,
  open,
  onClose,
  causaIniziale,
}: {
  cliente: Cliente;
  open: boolean;
  onClose: () => void;
  causaIniziale?: string;
}) {
  const addConversazione = useApp((s) => s.addConversazione);
  const addCronologia = useApp((s) => s.addCronologia);

  const [azione, setAzione] = useState<ModuloAI>("pareri");
  const [variante, setVariante] = useState<VarianteParere>("completo");
  const [tipoAtto, setTipoAtto] = useState<string>(TIPI_ATTO[0]);
  const [tipoAttoCustom, setTipoAttoCustom] = useState("");
  const tipoAttoEff = tipoAtto === "Altro" ? (tipoAttoCustom.trim() || "Atto") : tipoAtto;
  const [causaId, setCausaId] = useState<string | undefined>(causaIniziale ?? cliente.cause[0]?.id);

  // Quando si apre con una pratica specifica, preselezionala.
  useEffect(() => {
    if (open && causaIniziale) setCausaId(causaIniziale);
  }, [open, causaIniziale]);
  const [istruzioni, setIstruzioni] = useState("");
  const docAnalizzabili = useMemo(
    () => cliente.documenti.filter((d) => d.storagePath && ANALIZZABILI.includes(d.estensione.toLowerCase())),
    [cliente.documenti],
  );
  const [docIds, setDocIds] = useState<string[]>(() => docAnalizzabili.map((d) => d.id));

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fatto, setFatto] = useState(false);
  const [titoloSalvato, setTitoloSalvato] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const causa = cliente.cause.find((c) => c.id === causaId);
  const nome = nomeCliente(cliente);

  const toggleDoc = (id: string) =>
    setDocIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const reset = () => {
    setOutput("");
    setFatto(false);
    setLoading(false);
    setTitoloSalvato("");
  };

  const chiudi = () => {
    abortRef.current?.abort();
    reset();
    onClose();
  };

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const buildPrompt = () => {
    const rifPratica = causa ? ` nella pratica "${causa.oggetto}"` : "";
    const rifDoc = docIds.length ? " Analizza anche i documenti allegati." : "";
    const istr = istruzioni.trim() ? ` Istruzioni specifiche: ${istruzioni.trim()}.` : "";
    if (azione === "pareri")
      return `Redigi un parere legale approfondito sulla posizione del cliente ${nome}${rifPratica}.${istr}${rifDoc}`;
    if (azione === "redattore")
      return `${istruzioni.trim() || `Redigi l'atto per il cliente ${nome}${rifPratica}.`}${rifDoc}`;
    return istruzioni.trim() || `Analizza la posizione del cliente ${nome}${rifPratica} e indica le priorità operative.`;
  };

  const titoloPer = () => {
    const base = causa?.oggetto || nome;
    if (azione === "pareri") return `Parere — ${base}`;
    if (azione === "redattore") return `${tipoAttoEff} — ${base}`;
    return (istruzioni.trim().slice(0, 70) || `Analisi posizione — ${nome}`);
  };

  const esegui = async () => {
    const prompt = buildPrompt();
    reset();
    setLoading(true);
    const ac = new AbortController();
    abortRef.current = ac;

    const documenti: DocumentoRef[] = docAnalizzabili
      .filter((d) => docIds.includes(d.id))
      .map((d) => ({ path: d.storagePath!, nome: `${d.nome}.${d.estensione}`, estensione: d.estensione }));

    let testo = "";
    try {
      testo = await streamAI(
        azione,
        prompt,
        { cliente, causa, tipoAtto: azione === "redattore" ? tipoAttoEff : undefined },
        (parziale) => setOutput(parziale),
        ac.signal,
        undefined,
        documenti.length ? documenti : undefined,
        azione === "pareri" ? variante : undefined,
      );
    } catch (e) {
      if (!ac.signal.aborted) {
        const msg = e instanceof Error ? e.message : "Errore imprevisto";
        setOutput(`> ⚠️ ${msg}`);
      }
      setLoading(false);
      return;
    }

    if (!ac.signal.aborted && testo) {
      const titolo = titoloPer();
      const conv: ConversazioneAI = {
        id: uuid(),
        modulo: azione,
        titolo,
        messaggi: [
          { id: uid("m"), ruolo: "utente", contenuto: prompt, createdAt: oggi() },
          { id: uid("m"), ruolo: "assistente", contenuto: testo, createdAt: oggi() },
        ],
        clienteId: cliente.id,
        causaId,
        createdAt: oggi(),
        updatedAt: oggi(),
      };
      addConversazione(conv);
      const tipoCron = azione === "pareri" ? "Parere" : azione === "redattore" ? "Atto" : "Chat";
      addCronologia({ testo: titolo, tipo: tipoCron, convId: conv.id, modulo: azione });
      setTitoloSalvato(titolo);
      setFatto(true);
    }
    setLoading(false);
  };

  // ---- Footer dinamico ----
  let footer: React.ReactNode;
  if (loading) {
    footer = (
      <Button variant="secondary" onClick={stop}>
        <Square size={16} /> Ferma
      </Button>
    );
  } else if (fatto) {
    footer = (
      <>
        <Button variant="secondary" onClick={reset}>Nuova analisi</Button>
        <EsportaButtons titolo={titoloSalvato} testo={output} />
        <Button onClick={chiudi}>Chiudi</Button>
      </>
    );
  } else {
    footer = (
      <>
        <Button variant="secondary" onClick={chiudi}>Annulla</Button>
        <Button onClick={esegui}>Analizza ed esegui</Button>
      </>
    );
  }

  const mostraForm = !loading && !output;

  return (
    <Modal open={open} onClose={chiudi} title={`Analizza ed esegui · ${nome}`} wide footer={footer}>
      {mostraForm ? (
        <div className="space-y-5">
          {/* Azione */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Cosa vuoi fare</p>
            <div className="grid grid-cols-3 gap-2">
              {AZIONI.map((a) => {
                const Icon = a.icon;
                const attivo = azione === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => setAzione(a.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      attivo ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    <Icon size={18} /> {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo di parere */}
          {azione === "pareri" && (
            <VarianteParereSelect value={variante} onChange={setVariante} />
          )}

          {/* Tipo atto */}
          {azione === "redattore" && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Tipo di atto</p>
              <Select value={tipoAtto} onChange={(e) => setTipoAtto(e.target.value)}>
                {TIPI_ATTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              {tipoAtto === "Altro" && (
                <input
                  value={tipoAttoCustom}
                  onChange={(e) => setTipoAttoCustom(e.target.value)}
                  placeholder="Specifica il tipo di atto"
                  className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
                />
              )}
            </div>
          )}

          {/* Pratica */}
          {cliente.cause.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Pratica (opzionale)</p>
              <Select value={causaId || ""} onChange={(e) => setCausaId(e.target.value || undefined)}>
                <option value="">Nessuna pratica specifica</option>
                {cliente.cause.map((c) => <option key={c.id} value={c.id}>{c.oggetto}</option>)}
              </Select>
            </div>
          )}

          {/* Documenti */}
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Documenti da analizzare
            </p>
            {docAnalizzabili.length === 0 ? (
              <p className="text-sm text-muted-2">
                Nessun documento analizzabile allegato. Caricane uno (PDF, immagini o TXT) nella scheda Documenti.
              </p>
            ) : (
              <div className="space-y-1.5">
                {docAnalizzabili.map((d) => (
                  <label key={d.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-hover">
                    <input type="checkbox" checked={docIds.includes(d.id)} onChange={() => toggleDoc(d.id)} className="accent-[var(--primary)]" />
                    <FileText size={15} className="text-primary" />
                    <span className="flex-1 truncate">{d.nome}.{d.estensione}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Istruzioni */}
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              Istruzioni {azione === "risposta_immediata" ? "/ domanda" : "(opzionale)"}
            </p>
            <Textarea
              value={istruzioni}
              onChange={(e) => setIstruzioni(e.target.value)}
              rows={3}
              placeholder={
                azione === "redattore"
                  ? "Es. cita in giudizio la controparte per il pagamento di…"
                  : azione === "risposta_immediata"
                  ? "Scrivi la domanda sulla posizione del cliente…"
                  : "Aspetti su cui vuoi che il parere si concentri…"
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {fatto && (
            <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-300">
              <Check size={14} /> Salvato nel fascicolo di {nome} · visibile nello storico
            </div>
          )}
          {loading && !output && <Elaborando label="Sto analizzando e generando…" />}
          {output && (
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <Markdown>{output}</Markdown>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
