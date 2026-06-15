"use client";

import { PageHeader, Button, Badge } from "@/components/ui";
import { Plus, MoreHorizontal } from "lucide-react";

const MEMBRI = [
  { iniziali: "MR", nome: "Avv. Marco Rossi", email: "m.rossi@studio.it", ruolo: "Admin" },
  { iniziali: "LB", nome: "Avv. Laura Bianchi", email: "l.bianchi@studio.it", ruolo: "Membro" },
  { iniziali: "GV", nome: "Avv. Giuseppe Verdi", email: "g.verdi@studio.it", ruolo: "Membro" },
];

export default function TeamPage() {
  return (
    <div className="animate-in">
      <PageHeader
        title="Team"
        subtitle="Gestisci i membri del tuo studio"
        action={<Button disabled><Plus size={18} /> Invita collega</Button>}
      />

      <div className="mb-4 rounded-xl border border-dashed border-border-strong bg-surface-2 px-4 py-3 text-sm text-muted">
        Funzionalità multi-utente in arrivo: ruoli, permessi e condivisione delle pratiche.
      </div>

      <div className="space-y-2.5">
        {MEMBRI.map((m) => (
          <div key={m.email} className="card flex items-center gap-4 p-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
              {m.iniziali}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.nome}</p>
              <p className="text-sm text-muted">{m.email}</p>
            </div>
            <Badge tone={m.ruolo === "Admin" ? "violet" : "gray"}>{m.ruolo}</Badge>
            <button className="rounded-lg p-2 text-muted-2 hover:bg-surface-hover hover:text-foreground" aria-label="Opzioni">
              <MoreHorizontal size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
