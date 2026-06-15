"use client";

import { useEffect, useState } from "react";
import type { Attivita, TipoAttivita, Causa } from "@/lib/types";
import { Field, Input, Textarea, Select } from "@/components/ui";
import { TIPO_ATTIVITA } from "@/lib/labels";

export type AttivitaDraft = Omit<Attivita, "id">;

export function AttivitaForm({
  cause,
  onChange,
}: {
  cause: Causa[];
  onChange: (d: AttivitaDraft, valido: boolean) => void;
}) {
  const [tipo, setTipo] = useState<TipoAttivita>("nota");
  const [titolo, setTitolo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [causaId, setCausaId] = useState<string>("");

  useEffect(() => {
    const d: AttivitaDraft = {
      tipo,
      titolo: titolo.trim(),
      descrizione: descrizione.trim() || undefined,
      data: new Date(data).toISOString(),
      causaId: causaId || undefined,
    };
    onChange(d, d.titolo.length > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, titolo, descrizione, data, causaId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoAttivita)}>
            {Object.entries(TIPO_ATTIVITA).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data">
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
      </div>
      <Field label="Titolo">
        <Input value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Es. Deposito comparsa di costituzione" />
      </Field>
      <Field label="Descrizione">
        <Textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} rows={3} />
      </Field>
      {cause.length > 0 && (
        <Field label="Pratica collegata (opzionale)">
          <Select value={causaId} onChange={(e) => setCausaId(e.target.value)}>
            <option value="">Nessuna</option>
            {cause.map((c) => (
              <option key={c.id} value={c.id}>{c.oggetto}</option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}
