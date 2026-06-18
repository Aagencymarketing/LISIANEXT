"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useUser } from "@/lib/auth/useUser";
import { streamAI } from "@/lib/ai/client";
import { Markdown } from "@/components/Markdown";
import { ConversazioniPanel } from "@/components/ai/ConversazioniPanel";
import { AiPanelOpenButton } from "@/components/ai/AiPanelOpenButton";
import { EsportaButtons } from "@/components/ai/EsportaButtons";
import { uid, uuid, oggi } from "@/lib/utils";
import { nomeCliente, type MessaggioChat, type ConversazioneAI } from "@/lib/types";
import { Sparkles, Send, Plus, Square, MessageSquare, Link2 } from "lucide-react";

const ESEMPI = [
  "Si ritiene possibile l'impugnazione della graduatoria?",
  "Si può alienare la proprietà di una costruzione separatamente dal suolo?",
  "Quando il concorrente illegittimamente escluso da una gara ha diritto al risarcimento?",
];

function Chat() {
  const params = useSearchParams();
  const addCronologia = useApp((s) => s.addCronologia);
  const addConversazione = useApp((s) => s.addConversazione);
  const updateConversazione = useApp((s) => s.updateConversazione);
  const clienti = useApp((s) => s.clienti);
  const aiPanelOpen = useApp((s) => s.aiPanelOpen);
  const toggleAiPanel = useApp((s) => s.toggleAiPanel);
  const { user } = useUser();
  const saluto = user?.nome || "Avvocato";

  const [messaggi, setMessaggi] = useState<MessaggioChat[]>([]);
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<string | undefined>();
  const [clienteId, setClienteId] = useState<string | undefined>();
  const convIdRef = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messaggi, streaming]);

  function persisti(completi: MessaggioChat[], primaDomanda: string) {
    let id = convIdRef.current;
    if (!id) {
      id = uuid();
      convIdRef.current = id;
      setConvId(id);
      const conv: ConversazioneAI = {
        id,
        modulo: "risposta_immediata",
        titolo: primaDomanda.slice(0, 90),
        messaggi: completi,
        clienteId,
        createdAt: oggi(),
        updatedAt: oggi(),
      };
      addConversazione(conv);
    } else {
      updateConversazione(id, { messaggi: completi });
    }
  }

  async function invia(testo: string) {
    const t = testo.trim();
    if (!t || loading) return;
    setInput("");
    const userMsg: MessaggioChat = { id: uid("m"), ruolo: "utente", contenuto: t, createdAt: oggi() };
    const conUtente = [...messaggi, userMsg];
    setMessaggi(conUtente);
    addCronologia({ testo: t, tipo: "Chat" });

    setLoading(true);
    setStreaming("");
    const ac = new AbortController();
    abortRef.current = ac;
    const cliente = clienti.find((c) => c.id === clienteId);
    const storia = messaggi.map((m) => ({ ruolo: m.ruolo, contenuto: m.contenuto }));
    let acc = "";
    try {
      acc = await streamAI(
        "risposta_immediata",
        t,
        cliente ? { cliente } : undefined,
        (parziale) => setStreaming(parziale),
        ac.signal,
        storia,
      );
    } catch (e) {
      if (!ac.signal.aborted) {
        const msg = e instanceof Error ? e.message : "Errore imprevisto";
        acc = `> ⚠️ ${msg}`;
      }
    }
    if (!ac.signal.aborted) {
      const assistMsg: MessaggioChat = {
        id: uid("m"),
        ruolo: "assistente",
        contenuto: acc,
        createdAt: oggi(),
      };
      const completi = [...conUtente, assistMsg];
      setMessaggi(completi);
      persisti(completi, conUtente[0].contenuto);
    }
    setStreaming("");
    setLoading(false);
  }

  function stop() {
    abortRef.current?.abort();
    if (streaming) {
      const assistMsg: MessaggioChat = {
        id: uid("m"),
        ruolo: "assistente",
        contenuto: streaming,
        createdAt: oggi(),
      };
      const completi = [...messaggi, assistMsg];
      setMessaggi(completi);
      persisti(completi, completi[0]?.contenuto || streaming.slice(0, 90));
    }
    setStreaming("");
    setLoading(false);
  }

  function nuova() {
    abortRef.current?.abort();
    setMessaggi([]);
    setStreaming("");
    setLoading(false);
    setConvId(undefined);
    convIdRef.current = undefined;
    setClienteId(undefined);
  }

  function apri(c: ConversazioneAI) {
    abortRef.current?.abort();
    setStreaming("");
    setLoading(false);
    setMessaggi(c.messaggi);
    setConvId(c.id);
    convIdRef.current = c.id;
    setClienteId(c.clienteId);
  }

  function collega(id?: string) {
    setClienteId(id);
    if (convIdRef.current) updateConversazione(convIdRef.current, { clienteId: id });
  }

  // Auto-invio da query (?q=)
  useEffect(() => {
    const q = params.get("q");
    if (q && !startedRef.current) {
      startedRef.current = true;
      invia(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const vuota = messaggi.length === 0 && !streaming;
  const trascrizione = messaggi
    .map((m) => (m.ruolo === "utente" ? `## Domanda\n\n${m.contenuto}` : `## Risposta\n\n${m.contenuto}`))
    .join("\n\n");

  return (
    <div className="flex h-[calc(100dvh-8rem)] gap-5">
      {/* Colonna chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <h1 className="text-lg font-semibold">Risposta immediata</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Collega a cliente */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1">
              <Link2 size={14} className="text-muted-2" />
              <select
                value={clienteId || ""}
                onChange={(e) => collega(e.target.value || undefined)}
                className="max-w-[150px] bg-transparent text-sm outline-none"
              >
                <option value="">Nessun cliente</option>
                {clienti.map((c) => (
                  <option key={c.id} value={c.id}>{nomeCliente(c)}</option>
                ))}
              </select>
            </div>
            {!vuota && messaggi.length > 0 && (
              <EsportaButtons titolo={messaggi[0]?.contenuto.slice(0, 50) || "Conversazione"} testo={trascrizione} />
            )}
            <button
              onClick={nuova}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <Plus size={16} /> Nuova
            </button>
            {!aiPanelOpen && (
              <AiPanelOpenButton label="Conversazioni" onClick={toggleAiPanel} />
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl">
          {vuota ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-bold">
                Ciao, <span className="text-primary">{saluto}</span>
              </h2>
              <p className="mt-1 text-muted">Come posso aiutarti oggi nella tua ricerca giuridica?</p>
              <div className="mt-6 w-full space-y-2">
                {ESEMPI.map((e) => (
                  <button
                    key={e}
                    onClick={() => invia(e)}
                    className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted transition hover:border-primary/40 hover:bg-surface-hover hover:text-foreground"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 px-1 pb-4">
              {messaggi.map((m) => <Bubble key={m.id} msg={m} />)}
              {streaming && (
                <Bubble msg={{ id: "stream", ruolo: "assistente", contenuto: streaming, createdAt: "" }} streaming />
              )}
              {loading && !streaming && (
                <div className="flex gap-1.5 px-2 text-primary">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-primary"
                      style={{ animation: "pulseDots 1.2s infinite", animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            invia(input);
          }}
          className="card mt-3 flex items-end gap-2 p-2.5"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                invia(input);
              }
            }}
            rows={1}
            placeholder="Scrivi la tua domanda giuridica..."
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-2"
          />
          {loading ? (
            <button
              type="button"
              onClick={stop}
              className="grid h-10 w-10 place-items-center rounded-xl bg-surface-hover text-foreground"
              aria-label="Ferma"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
              disabled={!input.trim()}
              aria-label="Invia"
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Pannello conversazioni salvate (richiudibile) */}
      {aiPanelOpen && (
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="card h-full p-4">
            <ConversazioniPanel
              modulo="risposta_immediata"
              titolo="Conversazioni"
              attivoId={convId}
              onApri={apri}
              onNuova={nuova}
              onClose={toggleAiPanel}
            />
          </div>
        </aside>
      )}
    </div>
  );
}

function Bubble({ msg, streaming }: { msg: MessaggioChat; streaming?: boolean }) {
  if (msg.ruolo === "utente") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {msg.contenuto}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Sparkles size={16} />
      </div>
      <div className="card max-w-[85%] px-4 py-3">
        <Markdown>{msg.contenuto}</Markdown>
        {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Chat />
    </Suspense>
  );
}
