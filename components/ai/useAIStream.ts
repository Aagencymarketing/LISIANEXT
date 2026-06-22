"use client";

import { useCallback, useRef, useState } from "react";
import { type ContestoAI } from "@/lib/ai/mock";
import { streamAI, type VarianteParere, type DocumentoInline } from "@/lib/ai/client";
import type { ModuloAI } from "@/lib/types";

export function useAIStream(modulo: ModuloAI) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (
      prompt: string,
      ctx?: ContestoAI,
      opts?: { variante?: VarianteParere; documentiInline?: DocumentoInline[] },
    ): Promise<string | null> => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setOutput("");
      let acc = "";
      try {
        acc = await streamAI(
          modulo,
          prompt,
          ctx,
          (parziale) => setOutput(parziale),
          ac.signal,
          undefined,
          undefined,
          opts?.variante,
          opts?.documentiInline,
        );
      } catch (e) {
        if (ac.signal.aborted) return null;
        const msg = e instanceof Error ? e.message : "Errore imprevisto";
        const testo = `\n\n> ⚠️ ${msg}`;
        setOutput((o) => o + testo);
        setLoading(false);
        return null;
      }
      if (ac.signal.aborted) return null;
      setLoading(false);
      return acc;
    },
    [modulo],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setOutput("");
    setLoading(false);
  }, []);

  return { output, loading, run, stop, reset, setOutput };
}
