"use client";

/** Indicatore di elaborazione mostrato mentre l'AI prepara la risposta (prima dello streaming). */
export function Elaborando({ label }: { label: string }) {
  return (
    <div className="card animate-in flex items-center gap-3 p-5 text-sm text-muted">
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            style={{ animation: "pulseDots 1.2s infinite", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}
