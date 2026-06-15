"use client";

import { useCallback, useRef, useState } from "react";
import { generaRisposta, streamRisposta, type ContestoAI } from "@/lib/ai/mock";
import type { ModuloAI } from "@/lib/types";

export function useAIStream(modulo: ModuloAI) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (prompt: string, ctx?: ContestoAI) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setOutput("");
      const full = generaRisposta(modulo, prompt, ctx);
      let acc = "";
      for await (const chunk of streamRisposta(full, ac.signal)) {
        acc += chunk;
        setOutput(acc);
      }
      if (!ac.signal.aborted) setLoading(false);
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
