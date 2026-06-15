"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader, Button, Modal } from "@/components/ui";
import { Sun, Moon, RotateCcw, User, Database } from "lucide-react";

export default function ImpostazioniPage() {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const resetDemo = useApp((s) => s.resetDemo);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="animate-in max-w-2xl">
      <PageHeader title="Impostazioni" subtitle="Preferenze dell'applicazione" />

      <div className="space-y-4">
        {/* Aspetto */}
        <section className="card p-5">
          <h3 className="mb-3 font-semibold">Aspetto</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "light", label: "Chiaro", icon: Sun },
              { key: "dark", label: "Scuro", icon: Moon },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  theme === t.key ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-hover"
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Profilo */}
        <section className="card p-5">
          <div className="flex items-center gap-2">
            <User size={17} className="text-primary" />
            <h3 className="font-semibold">Profilo</h3>
            <span className="rounded-md bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-2">soon</span>
          </div>
          <p className="mt-2 text-sm text-muted">La gestione del profilo e delle credenziali sarà disponibile a breve.</p>
        </section>

        {/* Dati demo */}
        <section className="card p-5">
          <div className="flex items-center gap-2">
            <Database size={17} className="text-primary" />
            <h3 className="font-semibold">Dati dimostrativi</h3>
          </div>
          <p className="mt-2 text-sm text-muted">
            I dati del gestionale sono salvati localmente nel browser per la demo. Puoi ripristinare i dati
            di esempio in qualsiasi momento.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => setConfirm(true)}>
            <RotateCcw size={16} /> Ripristina dati demo
          </Button>
        </section>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Ripristina dati demo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Annulla</Button>
            <Button variant="danger" onClick={() => { resetDemo(); setConfirm(false); }}>Ripristina</Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Verranno ripristinati clienti, pratiche, cronologia e preferiti di esempio. Le modifiche fatte durante
          la demo andranno perse.
        </p>
      </Modal>
    </div>
  );
}
