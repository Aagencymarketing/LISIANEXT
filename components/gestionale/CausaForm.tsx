"use client";

import { useEffect, useState } from "react";
import type { Causa, MateriaCausa, StatoCausa } from "@/lib/types";
import { Field, Input, Textarea, Select } from "@/components/ui";
import { MATERIA_CAUSA, STATO_CAUSA } from "@/lib/labels";

export type CausaDraft = Omit<Causa, "id" | "createdAt">;

export function CausaForm({
  initial,
  onChange,
}: {
  initial?: Partial<CausaDraft>;
  onChange: (d: CausaDraft, valido: boolean) => void;
}) {
  const [oggetto, setOggetto] = useState(initial?.oggetto || "");
  const [materia, setMateria] = useState<MateriaCausa>(initial?.materia || "civile");
  const [stato, setStato] = useState<StatoCausa>(initial?.stato || "aperta");
  const [controparte, setControparte] = useState(initial?.controparte || "");
  const [foro, setForo] = useState(initial?.foro || "");
  const [numeroRuolo, setNumeroRuolo] = useState(initial?.numeroRuolo || "");
  const [valore, setValore] = useState(initial?.valore?.toString() || "");
  const [prossimaUdienza, setProssimaUdienza] = useState(
    initial?.prossimaUdienza ? initial.prossimaUdienza.slice(0, 10) : "",
  );
  const [note, setNote] = useState(initial?.note || "");

  useEffect(() => {
    const d: CausaDraft = {
      oggetto: oggetto.trim(),
      materia,
      stato,
      controparte: controparte.trim() || undefined,
      foro: foro.trim() || undefined,
      numeroRuolo: numeroRuolo.trim() || undefined,
      valore: valore ? Number(valore) : undefined,
      prossimaUdienza: prossimaUdienza ? new Date(prossimaUdienza).toISOString() : undefined,
      note: note.trim() || undefined,
    };
    onChange(d, d.oggetto.length > 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oggetto, materia, stato, controparte, foro, numeroRuolo, valore, prossimaUdienza, note]);

  return (
    <div className="space-y-4">
      <Field label="Oggetto della pratica">
        <Input value={oggetto} onChange={(e) => setOggetto(e.target.value)} placeholder="Es. Sfratto per morosità immobile Via Roma" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Materia">
          <Select value={materia} onChange={(e) => setMateria(e.target.value as MateriaCausa)}>
            {Object.entries(MATERIA_CAUSA).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Stato">
          <Select value={stato} onChange={(e) => setStato(e.target.value as StatoCausa)}>
            {Object.entries(STATO_CAUSA).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Controparte">
          <Input value={controparte} onChange={(e) => setControparte(e.target.value)} />
        </Field>
        <Field label="Foro / Tribunale">
          <Input value={foro} onChange={(e) => setForo(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numero di ruolo">
          <Input value={numeroRuolo} onChange={(e) => setNumeroRuolo(e.target.value)} placeholder="R.G. .../...." />
        </Field>
        <Field label="Valore (€)">
          <Input type="number" value={valore} onChange={(e) => setValore(e.target.value)} />
        </Field>
      </div>
      <Field label="Prossima udienza">
        <Input type="date" value={prossimaUdienza} onChange={(e) => setProssimaUdienza(e.target.value)} />
      </Field>
      <Field label="Note">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </Field>
    </div>
  );
}
