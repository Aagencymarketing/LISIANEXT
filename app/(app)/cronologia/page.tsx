"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatData } from "@/lib/utils";
import { Badge, Input, PageHeader, EmptyState } from "@/components/ui";
import { Search, MessageSquare, Clock } from "lucide-react";

export default function CronologiaPage() {
  const cronologia = useApp((s) => s.cronologia);
  const [q, setQ] = useState("");

  const filtrate = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return cronologia;
    return cronologia.filter((v) => v.testo.toLowerCase().includes(t));
  }, [cronologia, q]);

  return (
    <div className="animate-in">
      <PageHeader title="Cronologia" subtitle="Tutte le tue ricerche passate" />

      <div className="relative mb-5">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca nella cronologia..." className="pl-11" />
      </div>

      {filtrate.length === 0 ? (
        <EmptyState icon={<Clock size={26} />} title="Cronologia vuota" description="Le tue ricerche e richieste appariranno qui." />
      ) : (
        <div className="space-y-2">
          {filtrate.map((v) => (
            <Link
              key={v.id}
              href={`/ricerche?q=${encodeURIComponent(v.testo)}`}
              className="card group flex items-center gap-3 p-4 transition hover:bg-surface-hover"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                <MessageSquare size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{v.testo}</p>
                <p className="mt-0.5 text-xs text-muted-2">{formatData(v.createdAt, true)} · {v.tipo}</p>
              </div>
              {v.occorrenze != null && <Badge tone="violet">{v.occorrenze}×</Badge>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
