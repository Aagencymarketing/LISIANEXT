"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { getSentenzaById } from "@/lib/ai/sentenze";
import { Badge, EmptyState, Button, PageHeader } from "@/components/ui";
import { Star, Search } from "lucide-react";

export default function PreferitiPage() {
  const preferiti = useApp((s) => s.preferiti);
  const togglePreferito = useApp((s) => s.togglePreferito);

  const voci = preferiti.map((id) => getSentenzaById(id)).filter(Boolean);

  return (
    <div className="animate-in">
      <PageHeader title="Preferiti" subtitle="Le sentenze e massime che hai salvato" />

      {voci.length === 0 ? (
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
          {voci.map((s) => (
            <div key={s!.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-primary">{s!.estremi}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-2">
                    <Badge tone="blue">{s!.materia}</Badge>
                    <span>{s!.fonte}</span>
                    <span>·</span>
                    <span>{s!.data}</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePreferito(s!.id)}
                  className="shrink-0 rounded-lg p-2 text-amber-500"
                  aria-label="Rimuovi preferito"
                >
                  <Star size={18} fill="currentColor" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{s!.massima}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
