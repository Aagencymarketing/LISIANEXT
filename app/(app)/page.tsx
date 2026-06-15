"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatData } from "@/lib/utils";
import { Badge } from "@/components/ui";
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";

const SUGGERIMENTI = [
  "La clausola risolutiva di un contratto rientra tra quelle vessatorie ex art. 1341 c.c.?",
  "È legittimato a impugnare le delibere condominiali l'utilizzatore di un immobile in leasing?",
  "Si ritiene possibile l'impugnazione della graduatoria di una gara d'appalto?",
];

export default function DashboardPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const clienti = useApp((s) => s.clienti);
  const cronologia = useApp((s) => s.cronologia);
  const preferiti = useApp((s) => s.preferiti);

  const causeAttive = clienti.reduce(
    (acc, c) =>
      acc +
      c.cause.filter((ca) => !["chiusa_vinta", "chiusa_persa", "archiviata"].includes(ca.stato))
        .length,
    0,
  );

  const vai = (testo: string) => {
    if (!testo.trim()) return;
    router.push(`/ai/risposta-immediata?q=${encodeURIComponent(testo)}`);
  };

  const stats = [
    { icon: MessageSquare, value: cronologia.length, label: "Ricerche totali", tone: "violet" as const },
    { icon: Star, value: preferiti.length, label: "Preferiti", tone: "amber" as const },
    { icon: Users, value: clienti.length, label: "Clienti", tone: "blue" as const },
    { icon: TrendingUp, value: causeAttive, label: "Pratiche attive", tone: "green" as const },
  ];

  return (
    <div className="animate-in">
      {/* Hero */}
      <div className="mx-auto max-w-3xl pt-6 text-center sm:pt-10">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Sparkles size={30} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ciao, <span className="text-primary">Demo</span>
        </h1>
        <p className="mt-2 text-lg text-muted">
          Come posso aiutarti oggi nella tua ricerca giuridica?
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            vai(q);
          }}
          className="card mt-8 flex items-center gap-2 p-2.5 shadow-[var(--shadow-pop)]"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Scrivi la tua domanda giuridica..."
            className="flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-2"
          />
          <button
            type="submit"
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover"
            aria-label="Invia"
          >
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-4 space-y-2.5">
          {SUGGERIMENTI.map((s) => (
            <button
              key={s}
              onClick={() => vai(s)}
              className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-muted transition hover:border-primary/40 hover:bg-surface-hover hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className="mx-auto mb-2 flex justify-center text-primary">
              <s.icon size={22} />
            </div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ricerche recenti */}
      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ricerche recenti</h2>
          <Link href="/cronologia" className="text-sm font-medium text-primary hover:underline">
            Vedi tutte
          </Link>
        </div>
        <div className="space-y-2">
          {cronologia.slice(0, 4).map((v) => (
            <Link
              key={v.id}
              href={`/ricerche?q=${encodeURIComponent(v.testo)}`}
              className="card flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-hover"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                <Clock size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.testo}</p>
                <p className="text-xs text-muted-2">
                  {formatData(v.createdAt, true)} · {v.tipo}
                </p>
              </div>
              {v.occorrenze != null && <Badge tone="violet">{v.occorrenze}×</Badge>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
