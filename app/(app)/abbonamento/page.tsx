"use client";

import { PageHeader, Button, Badge } from "@/components/ui";
import { Check, Zap } from "lucide-react";

const PIANI = [
  {
    nome: "Base",
    prezzo: "29",
    feat: ["Risposta immediata", "Ricerche legali", "Fino a 20 clienti", "Cronologia 30 giorni"],
  },
  {
    nome: "Studio",
    prezzo: "79",
    badge: "Attuale",
    feat: ["Tutto del piano Base", "Pareri approfonditi", "Redattore atti", "Clienti illimitati", "Banca dati sentenze completa"],
  },
  {
    nome: "Studio Plus",
    prezzo: "149",
    feat: ["Tutto del piano Studio", "Team multi-utente", "Integrazioni avanzate", "Supporto prioritario"],
  },
];

export default function AbbonamentoPage() {
  return (
    <div className="animate-in">
      <PageHeader title="Abbonamento" subtitle="Gestisci il tuo piano e i consumi" />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted">Credito residuo</p>
          <p className="text-3xl font-bold">€ 0,00</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Zap size={16} className="text-accent" /> Piano <span className="font-semibold text-foreground">Studio</span> attivo
        </div>
        <Button>Ricarica credito</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PIANI.map((p) => (
          <div key={p.nome} className={`card p-6 ${p.badge ? "ring-2 ring-primary" : ""}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{p.nome}</h3>
              {p.badge && <Badge tone="violet">{p.badge}</Badge>}
            </div>
            <p className="mt-2"><span className="text-3xl font-bold">€{p.prezzo}</span><span className="text-muted">/mese</span></p>
            <ul className="mt-5 space-y-2.5">
              {p.feat.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button variant={p.badge ? "secondary" : "primary"} className="mt-6 w-full" disabled={!!p.badge}>
              {p.badge ? "Piano attuale" : "Passa a " + p.nome}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
