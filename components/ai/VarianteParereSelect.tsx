"use client";

import type { VarianteParere } from "@/lib/ai/client";

const OPZIONI: { k: VarianteParere; label: string; desc: string }[] = [
  { k: "completo", label: "Completo", desc: "Strutturato, sezioni I–VI + tabella" },
  { k: "sintetico", label: "Sintetico", desc: "Breve ed essenziale" },
];

/** Selettore del tipo di parere: completo/strutturato vs sintetico/standard. */
export function VarianteParereSelect({
  value,
  onChange,
}: {
  value: VarianteParere;
  onChange: (v: VarianteParere) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Tipo di parere</p>
      <div className="grid grid-cols-2 gap-2">
        {OPZIONI.map((o) => (
          <button
            key={o.k}
            type="button"
            onClick={() => onChange(o.k)}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              value === o.k ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-hover"
            }`}
          >
            <span className="block text-sm font-medium">{o.label}</span>
            <span className="block text-xs text-muted-2">{o.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
