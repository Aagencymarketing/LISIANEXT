"use client";

import { Button } from "@/components/ui";
import { RefreshCw, AlertTriangle } from "lucide-react";

/**
 * Rete di sicurezza: se una pagina va in crash (es. sessione scaduta, errore
 * temporaneo), invece di una schermata bloccata mostra un recupero con tasti.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
        <AlertTriangle size={26} />
      </div>
      <div>
        <h2 className="text-xl font-bold">Qualcosa è andato storto</h2>
        <p className="mt-1 text-muted">
          Si è verificato un problema temporaneo (a volte è la sessione scaduta). Ricarica per continuare.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => reset()}>
          <RefreshCw size={16} /> Riprova
        </Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Ricarica la pagina
        </Button>
      </div>
    </div>
  );
}
