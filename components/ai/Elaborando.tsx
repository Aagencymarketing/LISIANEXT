"use client";

import { Loader2, Sparkles } from "lucide-react";

/** Indicatore di elaborazione (ben visibile) mostrato mentre l'AI prepara la risposta. */
export function Elaborando({ label }: { label: string }) {
  return (
    <div className="card animate-in flex flex-col items-center gap-3 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Sparkles size={22} className="animate-pulse" />
      </span>
      <div>
        <p className="flex items-center justify-center gap-2 text-base font-semibold text-foreground">
          <Loader2 size={18} className="animate-spin text-primary" />
          {label}
        </p>
        <p className="mt-1 text-sm text-muted">L&apos;AI sta elaborando — può richiedere qualche secondo.</p>
      </div>
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            style={{ animation: "pulseDots 1.2s infinite", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}
