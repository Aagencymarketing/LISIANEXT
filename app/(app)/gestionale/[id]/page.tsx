"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { nomeCliente, inizialiCliente } from "@/lib/types";
import { STATO_CAUSA, MATERIA_CAUSA, TIPO_ATTIVITA } from "@/lib/labels";
import { formatData, formatEuro } from "@/lib/utils";
import { Badge, Button, Modal, EmptyState, Select, type Tone } from "@/components/ui";
import type { ModuloAI, SentenzaRisultato } from "@/lib/types";
import { ClienteForm, type ClienteDraft } from "@/components/gestionale/ClienteForm";
import { CausaForm, type CausaDraft } from "@/components/gestionale/CausaForm";
import { AttivitaForm, type AttivitaDraft } from "@/components/gestionale/AttivitaForm";
import { ClienteAI } from "@/components/gestionale/ClienteAI";
import { AnalizzaEsegui } from "@/components/gestionale/AnalizzaEsegui";
import { PraticaFolder } from "@/components/gestionale/PraticaFolder";
import { ElaboratoCard } from "@/components/gestionale/ElaboratoCard";
import { useUser } from "@/lib/auth/useUser";
import {
  uploadDocumento,
  signedUrlDocumento,
  deleteStorageObject,
} from "@/lib/db/storage";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Briefcase,
  Gavel,
  CalendarClock,
  FileText,
  Euro,
  Download,
  Loader2,
  Sparkles,
  Scale,
  ChevronDown,
} from "lucide-react";

type Tab = "panoramica" | "pratiche" | "lavori" | "storico" | "documenti";

interface TimelineItem {
  id: string;
  data: string;
  badge: { label: string; tone: Tone };
  titolo: string;
  descrizione?: string;
  causaId?: string;
  kind: "attivita" | "conversazione";
}

const BADGE_MODULO: Record<ModuloAI, { label: string; tone: Tone }> = {
  risposta_immediata: { label: "Risposta AI", tone: "blue" },
  pareri: { label: "Parere AI", tone: "violet" },
  redattore: { label: "Atto AI", tone: "amber" },
  ricerche: { label: "Ricerca", tone: "gray" },
};

export default function ClienteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const clienti = useApp((s) => s.clienti);
  const dataLoaded = useApp((s) => s.dataLoaded);
  const updateCliente = useApp((s) => s.updateCliente);
  const removeCliente = useApp((s) => s.removeCliente);
  const addCausa = useApp((s) => s.addCausa);
  const updateCausa = useApp((s) => s.updateCausa);
  const removeCausa = useApp((s) => s.removeCausa);
  const addAttivita = useApp((s) => s.addAttivita);
  const removeAttivita = useApp((s) => s.removeAttivita);
  const addDocumento = useApp((s) => s.addDocumento);
  const updateDocumento = useApp((s) => s.updateDocumento);
  const removeDocumento = useApp((s) => s.removeDocumento);
  const conversazioni = useApp((s) => s.conversazioni);
  const removeConversazione = useApp((s) => s.removeConversazione);
  const updateConversazione = useApp((s) => s.updateConversazione);
  const sentenzeCliente = useApp((s) => s.sentenzeCliente);
  const removeSentenzaCliente = useApp((s) => s.removeSentenzaCliente);
  const updateSentenzaCliente = useApp((s) => s.updateSentenzaCliente);

  const cliente = clienti.find((c) => c.id === id);

  const [tab, setTab] = useState<Tab>("panoramica");
  // modali
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [causaOpen, setCausaOpen] = useState(false);
  const [attOpen, setAttOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [aeOpen, setAeOpen] = useState(false);
  const [aeCausa, setAeCausa] = useState<string | undefined>(undefined);
  const apriAnalizza = (causaId?: string) => { setAeCausa(causaId); setAeOpen(true); };
  // draft buffers
  const [editDraft, setEditDraft] = useState<ClienteDraft | null>(null);
  const [editValido, setEditValido] = useState(false);
  const [causaDraft, setCausaDraft] = useState<CausaDraft | null>(null);
  const [causaValido, setCausaValido] = useState(false);
  const [attDraft, setAttDraft] = useState<AttivitaDraft | null>(null);
  const [attValido, setAttValido] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docCausa, setDocCausa] = useState("");
  const [docUploading, setDocUploading] = useState(false);
  const { user } = useUser();

  // Storico unificato: attività manuali + elementi AI (chat/pareri/atti) collegati al cliente
  const storicoOrdinato = useMemo<TimelineItem[]>(() => {
    if (!cliente) return [];
    const daAttivita: TimelineItem[] = cliente.attivita.map((a) => ({
      id: a.id,
      data: a.data,
      badge: TIPO_ATTIVITA[a.tipo],
      titolo: a.titolo,
      descrizione: a.descrizione,
      causaId: a.causaId,
      kind: "attivita",
    }));
    const daConversazioni: TimelineItem[] = conversazioni
      .filter((c) => c.clienteId === cliente.id)
      .map((c) => ({
        id: c.id,
        data: c.updatedAt,
        badge: BADGE_MODULO[c.modulo],
        titolo: c.titolo,
        descrizione: c.messaggi.find((m) => m.ruolo === "assistente")?.contenuto?.slice(0, 150),
        causaId: c.causaId,
        kind: "conversazione",
      }));
    return [...daAttivita, ...daConversazioni].sort(
      (a, b) => +new Date(b.data) - +new Date(a.data),
    );
  }, [cliente, conversazioni]);

  const eliminaStorico = (item: TimelineItem) => {
    if (!cliente) return;
    if (item.kind === "attivita") removeAttivita(cliente.id, item.id);
    else removeConversazione(item.id);
  };

  if (!cliente && !dataLoaded) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted">
        <Loader2 size={20} className="animate-spin" /> Caricamento...
      </div>
    );
  }

  if (!cliente) {
    return (
      <EmptyState
        icon={<Briefcase size={26} />}
        title="Cliente non trovato"
        description="Il cliente richiesto non esiste o è stato rimosso."
        action={
          <Link href="/gestionale">
            <Button><ArrowLeft size={16} /> Torna al gestionale</Button>
          </Link>
        }
      />
    );
  }

  // Tutti i lavori AI collegati al cliente (anche senza pratica): pareri, atti,
  // risposte interattive, "Analizza ed esegui".
  const lavoriCliente = conversazioni
    .filter((c) => c.clienteId === cliente.id)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  const sentenzeDelCliente = sentenzeCliente.filter((x) => x.clienteId === cliente.id);

  const causeAttive = cliente.cause.filter(
    (c) => !["chiusa_vinta", "chiusa_persa", "archiviata"].includes(c.stato),
  );
  const valoreTotale = cliente.cause.reduce((a, c) => a + (c.valore || 0), 0);
  const prossima = cliente.cause
    .filter((c) => c.prossimaUdienza && new Date(c.prossimaUdienza) >= new Date())
    .sort((a, b) => +new Date(a.prossimaUdienza!) - +new Date(b.prossimaUdienza!))[0];

  const salvaModifica = () => {
    if (!editDraft || !editValido) return;
    updateCliente(cliente.id, editDraft);
    setEditOpen(false);
  };
  const elimina = () => {
    removeCliente(cliente.id);
    router.push("/gestionale");
  };
  const salvaCausa = () => {
    if (!causaDraft || !causaValido) return;
    addCausa(cliente.id, causaDraft);
    setCausaOpen(false);
    setTab("pratiche");
  };
  const salvaAttivita = () => {
    if (!attDraft || !attValido) return;
    addAttivita(cliente.id, attDraft);
    setAttOpen(false);
    setTab("storico");
  };
  const salvaDoc = async () => {
    if (!docFile || !user) return;
    setDocUploading(true);
    try {
      const { storagePath, nome, estensione } = await uploadDocumento(
        docFile,
        user.id,
        cliente.id,
      );
      addDocumento(
        cliente.id,
        { nome, estensione, causaId: docCausa || undefined },
        storagePath,
      );
      setDocFile(null);
      setDocCausa("");
      setDocOpen(false);
      setTab("documenti");
    } catch (e) {
      console.error("[upload]", e);
      alert("Caricamento non riuscito. Riprova.");
    } finally {
      setDocUploading(false);
    }
  };

  const scaricaDoc = async (storagePath?: string) => {
    if (!storagePath) return;
    try {
      const url = await signedUrlDocumento(storagePath);
      window.open(url, "_blank");
    } catch (e) {
      console.error("[download]", e);
    }
  };

  const eliminaDoc = (docId: string, storagePath?: string) => {
    if (storagePath) deleteStorageObject(storagePath).catch(() => {});
    removeDocumento(cliente.id, docId);
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "panoramica", label: "Panoramica" },
    { key: "pratiche", label: "Pratiche", count: cliente.cause.length },
    { key: "lavori", label: "Lavori AI", count: lavoriCliente.length + sentenzeDelCliente.length },
    { key: "storico", label: "Storico", count: storicoOrdinato.length },
    { key: "documenti", label: "Documenti", count: cliente.documenti.length },
  ];

  return (
    <div className="animate-in">
      <Link href="/gestionale" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Gestionale
      </Link>

      {/* Header */}
      <div className="card mb-5 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-soft text-lg font-bold text-primary">
            {inizialiCliente(cliente)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{nomeCliente(cliente)}</h1>
              <Badge tone="gray">{cliente.tipo === "azienda" ? "Azienda" : "Persona fisica"}</Badge>
              {(cliente.tags || []).map((t) => <Badge key={t} tone="violet">{t}</Badge>)}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              {cliente.email && <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {cliente.email}</span>}
              {cliente.telefono && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {cliente.telefono}</span>}
              {cliente.citta && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {cliente.citta}</span>}
            </div>
            {(cliente.codiceFiscale || cliente.partitaIva) && (
              <div className="mt-1 text-xs text-muted-2">
                {cliente.codiceFiscale && <>C.F. {cliente.codiceFiscale}</>}
                {cliente.partitaIva && <>P.IVA {cliente.partitaIva}</>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => apriAnalizza(undefined)}>
              <Sparkles size={15} /> Analizza ed esegui
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={15} /> Modifica
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDelOpen(true)} className="text-danger hover:bg-danger/10">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key ? "text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count != null && <span className="ml-1.5 text-xs text-muted-2">{t.count}</span>}
            {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* PANORAMICA */}
      {tab === "panoramica" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Briefcase} value={String(causeAttive.length)} label="Pratiche attive" />
            <StatCard icon={Gavel} value={String(cliente.cause.length)} label="Pratiche totali" />
            <StatCard icon={Euro} value={formatEuro(valoreTotale)} label="Valore complessivo" />
            <StatCard
              icon={CalendarClock}
              value={prossima ? formatData(prossima.prossimaUdienza) : "—"}
              label="Prossima udienza"
            />
          </div>

          <ClienteAI cliente={cliente} />

          {cliente.note && (
            <div className="card p-5">
              <h3 className="mb-2 text-sm font-semibold text-muted">Note</h3>
              <p className="text-sm leading-relaxed">{cliente.note}</p>
            </div>
          )}

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Ultime attività</h3>
              <button onClick={() => setTab("storico")} className="text-sm text-primary hover:underline">
                Vedi tutto
              </button>
            </div>
            {storicoOrdinato.length === 0 ? (
              <p className="text-sm text-muted-2">Nessuna attività registrata.</p>
            ) : (
              <Timeline items={storicoOrdinato.slice(0, 4)} cause={cliente.cause} onApriPratica={() => setTab("pratiche")} />
            )}
          </div>
        </div>
      )}

      {/* PRATICHE */}
      {tab === "pratiche" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCausaOpen(true)}><Plus size={16} /> Nuova pratica</Button>
          </div>
          {cliente.cause.length === 0 ? (
            <EmptyState icon={<Gavel size={24} />} title="Nessuna pratica" description="Aggiungi la prima pratica (es. “Armani c. Palmacci”): è la sottocartella che conterrà i suoi pareri, atti e documenti."
              action={<Button size="sm" onClick={() => setCausaOpen(true)}><Plus size={16} /> Nuova pratica</Button>} />
          ) : (
            cliente.cause.map((c) => (
              <PraticaFolder
                key={c.id}
                cliente={cliente}
                causa={c}
                onAnalizza={apriAnalizza}
                onScaricaDoc={scaricaDoc}
                onEliminaDoc={eliminaDoc}
              />
            ))
          )}
        </div>
      )}

      {/* LAVORI AI */}
      {tab === "lavori" && (
        <div className="space-y-3">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Tutti i pareri, atti, risposte e analisi generati per questo cliente — apribili ed esportabili.
            </p>
            <Button size="sm" onClick={() => apriAnalizza(undefined)} className="shrink-0">
              <Sparkles size={15} /> Analizza ed esegui
            </Button>
          </div>
          {lavoriCliente.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={24} />}
              title="Nessun lavoro AI"
              description="Usa “Analizza ed esegui”, oppure collega questo cliente da Pareri, Atti o Risposte interattive: i lavori compariranno qui."
              action={<Button size="sm" onClick={() => apriAnalizza(undefined)}><Sparkles size={15} /> Analizza ed esegui</Button>}
            />
          ) : (
            <div className="space-y-2">
              {lavoriCliente.map((c) => (
                <ElaboratoCard
                  key={c.id}
                  c={c}
                  onElimina={() => removeConversazione(c.id)}
                  pratiche={cliente.cause.map((ca) => ({ id: ca.id, oggetto: ca.oggetto }))}
                  onCambiaPratica={(causaId) => updateConversazione(c.id, { causaId })}
                />
              ))}
            </div>
          )}

          {/* Sentenze salvate per il cliente */}
          {sentenzeDelCliente.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <Scale size={14} /> Sentenze salvate <span className="text-muted-2">({sentenzeDelCliente.length})</span>
              </p>
              <div className="space-y-2">
                {sentenzeDelCliente.map((x) => (
                  <SentenzaSalvataCard
                    key={x.id}
                    s={x.sentenza}
                    causaId={x.causaId}
                    pratiche={cliente.cause.map((ca) => ({ id: ca.id, oggetto: ca.oggetto }))}
                    onCambiaPratica={(causaId) => updateSentenzaCliente(x.id, causaId)}
                    onElimina={() => removeSentenzaCliente(x.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STORICO */}
      {tab === "storico" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAttOpen(true)}><Plus size={16} /> Aggiungi attività</Button>
          </div>
          {storicoOrdinato.length === 0 ? (
            <EmptyState icon={<CalendarClock size={24} />} title="Storico vuoto" description="Registra le attività svolte per tenere traccia della pratica." />
          ) : (
            <div className="card p-5">
              <Timeline items={storicoOrdinato} cause={cliente.cause} onDelete={eliminaStorico} onApriPratica={() => setTab("pratiche")} />
            </div>
          )}
        </div>
      )}

      {/* DOCUMENTI */}
      {tab === "documenti" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDocOpen(true)}><Plus size={16} /> Aggiungi documento</Button>
          </div>
          {cliente.documenti.length === 0 ? (
            <EmptyState icon={<FileText size={24} />} title="Nessun documento" description="Carica i documenti della pratica (simulato nella demo)." />
          ) : (
            cliente.documenti.map((d) => (
              <div key={d.id} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.nome}.{d.estensione}</p>
                  <p className="text-xs text-muted-2">{formatData(d.createdAt)}</p>
                </div>
                {cliente.cause.length > 0 && (
                  <Select
                    value={d.causaId || ""}
                    onChange={(e) => updateDocumento(cliente.id, d.id, { causaId: e.target.value || undefined })}
                    className="h-9 w-auto max-w-[200px] py-1.5 text-xs"
                    aria-label="Collega a una pratica"
                  >
                    <option value="">Nessuna pratica</option>
                    {cliente.cause.map((c) => (
                      <option key={c.id} value={c.id}>{c.oggetto}</option>
                    ))}
                  </Select>
                )}
                <button onClick={() => scaricaDoc(d.storagePath)} disabled={!d.storagePath} className="rounded-lg p-2 text-muted-2 hover:text-foreground disabled:opacity-40" aria-label="Scarica"><Download size={16} /></button>
                <button onClick={() => eliminaDoc(d.id, d.storagePath)} className="rounded-lg p-2 text-muted-2 hover:text-danger" aria-label="Elimina"><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ---- MODALI ---- */}
      <AnalizzaEsegui cliente={cliente} open={aeOpen} onClose={() => setAeOpen(false)} causaIniziale={aeCausa} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifica cliente"
        footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Annulla</Button><Button onClick={salvaModifica} disabled={!editValido}>Salva</Button></>}>
        <ClienteForm initial={cliente} onChange={(d, v) => { setEditDraft(d); setEditValido(v); }} />
      </Modal>

      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Elimina cliente"
        footer={<><Button variant="secondary" onClick={() => setDelOpen(false)}>Annulla</Button><Button variant="danger" onClick={elimina}>Elimina definitivamente</Button></>}>
        <p className="text-sm text-muted">
          Stai per eliminare <span className="font-semibold text-foreground">{nomeCliente(cliente)}</span> con
          tutte le pratiche e lo storico. L&apos;operazione non è reversibile.
        </p>
      </Modal>

      <Modal open={causaOpen} onClose={() => setCausaOpen(false)} title="Nuova pratica" wide
        footer={<><Button variant="secondary" onClick={() => setCausaOpen(false)}>Annulla</Button><Button onClick={salvaCausa} disabled={!causaValido}>Crea pratica</Button></>}>
        <CausaForm onChange={(d, v) => { setCausaDraft(d); setCausaValido(v); }} />
      </Modal>

      <Modal open={attOpen} onClose={() => setAttOpen(false)} title="Aggiungi attività"
        footer={<><Button variant="secondary" onClick={() => setAttOpen(false)}>Annulla</Button><Button onClick={salvaAttivita} disabled={!attValido}>Aggiungi</Button></>}>
        <AttivitaForm cause={cliente.cause} onChange={(d, v) => { setAttDraft(d); setAttValido(v); }} />
      </Modal>

      <Modal open={docOpen} onClose={() => setDocOpen(false)} title="Aggiungi documento"
        footer={<><Button variant="secondary" onClick={() => setDocOpen(false)} disabled={docUploading}>Annulla</Button><Button onClick={salvaDoc} disabled={!docFile || docUploading}>{docUploading ? <><Loader2 size={16} className="animate-spin" /> Caricamento...</> : "Carica"}</Button></>}>
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-2 px-6 py-8 text-center hover:bg-surface-hover">
            <FileText size={22} className="text-primary" />
            {docFile ? (
              <span className="text-sm font-medium">{docFile.name}</span>
            ) : (
              <>
                <span className="text-sm font-medium">Scegli un file da caricare</span>
                <span className="text-xs text-muted-2">PDF, DOCX, TXT, immagini…</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {cliente.cause.length > 0 && (
            <Select value={docCausa} onChange={(e) => setDocCausa(e.target.value)}>
              <option value="">Nessuna pratica collegata</option>
              {cliente.cause.map((c) => <option key={c.id} value={c.id}>{c.oggetto}</option>)}
            </Select>
          )}
          <p className="text-xs text-muted-2">Il file viene caricato in modo sicuro e privato sul tuo spazio Storage.</p>
        </div>
      </Modal>
    </div>
  );
}

function SentenzaSalvataCard({
  s,
  causaId,
  pratiche,
  onCambiaPratica,
  onElimina,
}: {
  s: SentenzaRisultato;
  causaId?: string;
  pratiche?: { id: string; oggetto: string }[];
  onCambiaPratica?: (causaId?: string) => void;
  onElimina: () => void;
}) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{s.estremi}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-2">
            {s.materia && <Badge tone="blue">{s.materia}</Badge>}
            {s.fonte && <span>{s.fonte}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pratiche && pratiche.length > 0 && onCambiaPratica && (
            <Select
              value={causaId || ""}
              onChange={(e) => onCambiaPratica(e.target.value || undefined)}
              className="h-8 w-auto max-w-[160px] py-1 text-xs"
              aria-label="Collega a una pratica"
            >
              <option value="">Nessuna pratica</option>
              {pratiche.map((p) => (
                <option key={p.id} value={p.id}>{p.oggetto}</option>
              ))}
            </Select>
          )}
          <button onClick={onElimina} className="rounded p-1 text-muted-2 hover:text-danger" aria-label="Rimuovi sentenza">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {s.massima && <p className="mt-2 text-sm leading-relaxed text-foreground/90">{s.massima}</p>}
      {s.testoCompleto && (
        <div className="mt-2">
          <button onClick={() => setAperta((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <ChevronDown size={14} className={`transition ${aperta ? "rotate-180" : ""}`} /> {aperta ? "Nascondi" : "Testo integrale"}
          </button>
          {aperta && (
            <p className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-foreground/80">
              {s.testoCompleto}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="card p-4">
      <Icon size={18} className="mb-2 text-primary" />
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-2">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Timeline({
  items,
  cause,
  onDelete,
  onApriPratica,
}: {
  items: TimelineItem[];
  cause: { id: string; oggetto: string }[];
  onDelete?: (item: TimelineItem) => void;
  onApriPratica?: (causaId: string) => void;
}) {
  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {items.map((a) => {
        const causa = cause.find((c) => c.id === a.causaId);
        return (
          <li key={a.id} className="relative">
            <span
              className={`absolute -left-[1.65rem] top-1 grid h-3 w-3 place-items-center rounded-full border-2 border-surface ${
                a.kind === "conversazione" ? "bg-accent" : "bg-primary"
              }`}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.badge.tone}>{a.badge.label}</Badge>
                  <span className="text-xs text-muted-2">{formatData(a.data, true)}</span>
                </div>
                <p className="mt-1 font-medium">{a.titolo}</p>
                {a.descrizione && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{a.descrizione}</p>}
                {causa &&
                  (onApriPratica ? (
                    <button
                      onClick={() => onApriPratica(causa.id)}
                      className="mt-1 inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline"
                    >
                      ↳ {causa.oggetto}
                    </button>
                  ) : (
                    <p className="mt-1 text-xs text-muted-2">↳ {causa.oggetto}</p>
                  ))}
              </div>
              {onDelete && (
                <button onClick={() => onDelete(a)} className="rounded p-1 text-muted-2 hover:text-danger" aria-label="Elimina">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
