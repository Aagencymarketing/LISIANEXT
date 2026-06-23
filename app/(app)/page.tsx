"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useUser } from "@/lib/auth/useUser";
import { formatData, primoNome } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { linkVoceCronologia } from "@/lib/cronologiaLink";
import {
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const clienti = useApp((s) => s.clienti);
  const cronologia = useApp((s) => s.cronologia);
  const preferiti = useApp((s) => s.preferiti);
  const { user } = useUser();
  const saluto = primoNome(user?.nome);

  const causeAttive = clienti.reduce(
    (acc, c) =>
      acc +
      c.cause.filter((ca) => !["chiusa_vinta", "chiusa_persa", "archiviata"].includes(ca.stato))
        .length,
    0,
  );

  const stats = [
    { icon: MessageSquare, value: cronologia.length, label: "Ricerche totali", tone: "violet" as const },
    { icon: Star, value: preferiti.length, label: "Preferiti", tone: "amber" as const },
    { icon: Users, value: clienti.length, label: "Clienti", tone: "blue" as const },
    { icon: TrendingUp, value: causeAttive, label: "Pratiche attive", tone: "green" as const },
  ];

  return (
    <div className="animate-in">
      {/* Intestazione — saluto */}
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Ciao, <span className="text-primary">{saluto}</span>
        </h1>
        <p className="mt-1 text-muted">Questo è lo stato dello studio e ciò che hai fatto di recente.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          <h2 className="text-lg font-semibold">Attività recenti</h2>
          <Link href="/cronologia" className="text-sm font-medium text-primary hover:underline">
            Vedi tutte
          </Link>
        </div>
        {cronologia.length === 0 ? (
          <div className="card px-4 py-10 text-center text-sm text-muted-2">
            Ancora nessuna attività. I tuoi pareri, atti, risposte e ricerche compariranno qui.
          </div>
        ) : (
          <div className="space-y-2">
            {cronologia.slice(0, 5).map((v) => (
              <Link
                key={v.id}
                href={linkVoceCronologia(v)}
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
        )}
      </div>
    </div>
  );
}
