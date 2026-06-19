"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import type { SentenzaRisultato } from "@/lib/types";
import { Badge, EmptyState, Button, PageHeader } from "@/components/ui";
import { Star, Search, ChevronDown } from "lucide-react";

export default function PreferitiPage() {
  const preferiti = useApp((s) => s.preferiti);
  const togglePreferito = useApp((s) => s.togglePreferito);

  return (
    <div className="animate-in">
      <PageHeader title="Preferiti" subtitle="Le sentenze e massime che hai salvato" />

      {preferiti.length === 0 ? (
        <EmptyState
          icon={<Star size={26} />}
          title="Nessun preferito"
          description="Salva sentenze e massime dalla sezione Ricerche Legali per ritrovarle qui."
          action={
            <Link href="/ricerche">
              <Button>
                <Search size={16} /> Vai alle ricerche
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {preferiti.map((s) => (
            <PreferitoCard key={s.id} s={s} onRimuovi={() => togglePreferito(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PreferitoCard({ s, onRimuovi }: { s: SentenzaRisultato; onRimuovi: () => void }) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-primary">{s.estremi}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-2">
            {s.materia && <Badge tone="blue">{s.materia}</Badge>}
            {s.fonte && <span>{s.fonte}</span>}
          </div>
        </div>
        <button onClick={onRimuovi} className="shrink-0 rounded-lg p-2 text-amber-500" aria-label="Rimuovi preferito">
          <Star size={18} fill="currentColor" />
        </button>
      </div>
      {s.massima && <p className="mt-3 text-sm leading-relaxed text-foreground/90">{s.massima}</p>}
      {s.testoCompleto && (
        <div className="mt-3 border-t border-border pt-3">
          <button onClick={() => setAperta((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ChevronDown size={15} className={`transition ${aperta ? "rotate-180" : ""}`} /> {aperta ? "Nascondi" : "Testo integrale"}
          </button>
          {aperta && (
            <p className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-foreground/80">
              {s.testoCompleto}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
