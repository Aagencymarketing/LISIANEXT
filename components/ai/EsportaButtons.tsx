"use client";

import { Button } from "@/components/ui";
import { FileDown, FileType2 } from "lucide-react";
import { stampaPDF } from "@/lib/export/pdf";
import { scaricaWord } from "@/lib/export/word";

/** Bottoni "Scarica PDF" e "Scarica Word" per un testo markdown. */
export function EsportaButtons({ titolo, testo }: { titolo: string; testo: string }) {
  if (!testo.trim()) return null;
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => stampaPDF(titolo, testo)}>
        <FileDown size={16} /> PDF
      </Button>
      <Button variant="secondary" size="sm" onClick={() => scaricaWord(titolo, testo)}>
        <FileType2 size={16} /> Word
      </Button>
    </>
  );
}
