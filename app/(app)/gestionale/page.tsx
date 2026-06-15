"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { nomeCliente, inizialiCliente } from "@/lib/types";
import { Button, Input, Modal, PageHeader, Badge, EmptyState } from "@/components/ui";
import { ClienteForm, type ClienteDraft } from "@/components/gestionale/ClienteForm";
import { formatData, tempoFa } from "@/lib/utils";
import { STATO_CAUSA } from "@/lib/labels";
import {
  Search,
  Plus,
  Briefcase,
  Users,
  Gavel,
  CalendarClock,
  ChevronRight,
} from "lucide-react";

export default function GestionalePage() {
  const router = useRouter();
  const clienti = useApp((s) => s.clienti);
  const addCliente = useApp((s) => s.addCliente);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClienteDraft | null>(null);
  const [valido, setValido] = useState(false);

  const filtrati = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return clienti;
    return clienti.filter((c) =>
      `${nomeCliente(c)} ${c.email || ""} ${(c.tags || []).join(" ")}`.toLowerCase().includes(t),
    );
  }, [clienti, q]);

  const totPratiche = clienti.reduce((a, c) => a + c.cause.length, 0);
  const prossimeUdienze = clienti
    .flatMap((c) => c.cause)
    .filter((ca) => ca.prossimaUdienza && new Date(ca.prossimaUdienza) >= new Date()).length;

  const salva = () => {
    if (!draft || !valido) return;
    const id = addCliente(draft);
    setOpen(false);
    setDraft(null);
    router.push(`/gestionale/${id}`);
  };

  return (
    <div className="animate-in">
      <PageHeader
        title="Gestionale"
        subtitle="Clienti, pratiche e storico dello studio"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={18} /> Nuovo cliente
          </Button>
        }
      />

      {/* Riepilogo */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { icon: Users, value: clienti.length, label: "Clienti" },
          { icon: Briefcase, value: totPratiche, label: "Pratiche" },
          { icon: CalendarClock, value: prossimeUdienze, label: "Prossime udienze" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <s.icon size={19} />
            </div>
            <div>
              <div className="text-xl font-bold leading-none">{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca clienti per nome, email o tag..."
          className="pl-11"
        />
      </div>

      {filtrati.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={26} />}
          title={q ? "Nessun cliente trovato" : "Nessun cliente"}
          description={q ? "Prova con un altro termine di ricerca." : "Aggiungi il tuo primo cliente per iniziare."}
          action={
            !q && (
              <Button onClick={() => setOpen(true)}>
                <Plus size={16} /> Nuovo cliente
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtrati.map((c) => {
            const attive = c.cause.filter(
              (ca) => !["chiusa_vinta", "chiusa_persa", "archiviata"].includes(ca.stato),
            );
            return (
              <Link
                key={c.id}
                href={`/gestionale/${c.id}`}
                className="card group flex items-center gap-4 p-4 transition hover:border-primary/40 hover:bg-surface-hover"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                  {inizialiCliente(c)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{nomeCliente(c)}</h3>
                    {(c.tags || []).slice(0, 1).map((t) => (
                      <Badge key={t} tone="violet">{t}</Badge>
                    ))}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {c.cause.length} {c.cause.length === 1 ? "pratica" : "pratiche"}
                    {attive.length > 0 && ` · ${attive.length} attive`}
                    {" · "}aggiornato {tempoFa(c.attivita[0]?.data || c.createdAt)}
                  </p>
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  {attive.slice(0, 1).map((ca) => (
                    <Badge key={ca.id} tone={STATO_CAUSA[ca.stato].tone}>
                      <Gavel size={11} /> {STATO_CAUSA[ca.stato].label}
                    </Badge>
                  ))}
                </div>
                <ChevronRight size={18} className="text-muted-2 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuovo cliente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Annulla</Button>
            <Button onClick={salva} disabled={!valido}>Salva cliente</Button>
          </>
        }
      >
        <ClienteForm
          onChange={(d, v) => {
            setDraft(d);
            setValido(v);
          }}
        />
      </Modal>
    </div>
  );
}
