"use client";

import { useEffect, useState } from "react";
import type { Cliente, TipoCliente } from "@/lib/types";
import { Field, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { User, Building2 } from "lucide-react";

export type ClienteDraft = Omit<
  Cliente,
  "id" | "createdAt" | "cause" | "attivita" | "documenti"
>;

export function ClienteForm({
  initial,
  onChange,
}: {
  initial?: Partial<ClienteDraft>;
  onChange: (draft: ClienteDraft, valido: boolean) => void;
}) {
  const [tipo, setTipo] = useState<TipoCliente>(initial?.tipo || "persona");
  const [nome, setNome] = useState(initial?.nome || "");
  const [cognome, setCognome] = useState(initial?.cognome || "");
  const [ragioneSociale, setRagioneSociale] = useState(initial?.ragioneSociale || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [telefono, setTelefono] = useState(initial?.telefono || "");
  const [codiceFiscale, setCodiceFiscale] = useState(initial?.codiceFiscale || "");
  const [partitaIva, setPartitaIva] = useState(initial?.partitaIva || "");
  const [citta, setCitta] = useState(initial?.citta || "");
  const [indirizzo, setIndirizzo] = useState(initial?.indirizzo || "");
  const [tags, setTags] = useState((initial?.tags || []).join(", "));
  const [note, setNote] = useState(initial?.note || "");

  // Emette il draft ad ogni cambiamento (con i valori aggiornati dello stato).
  useEffect(() => {
    const draft: ClienteDraft = {
      tipo,
      nome: nome.trim() || undefined,
      cognome: cognome.trim() || undefined,
      ragioneSociale: ragioneSociale.trim() || undefined,
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      codiceFiscale: codiceFiscale.trim() || undefined,
      partitaIva: partitaIva.trim() || undefined,
      citta: citta.trim() || undefined,
      indirizzo: indirizzo.trim() || undefined,
      note: note.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const valido =
      draft.tipo === "azienda"
        ? !!draft.ragioneSociale
        : !!(draft.nome || draft.cognome);
    onChange(draft, valido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, nome, cognome, ragioneSociale, email, telefono, codiceFiscale, partitaIva, citta, indirizzo, tags, note]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(["persona", "azienda"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition",
              tipo === t
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-muted hover:bg-surface-hover",
            )}
          >
            {t === "persona" ? <User size={16} /> : <Building2 size={16} />}
            {t === "persona" ? "Persona fisica" : "Azienda"}
          </button>
        ))}
      </div>

      {tipo === "persona" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Mario" />
          </Field>
          <Field label="Cognome">
            <Input value={cognome} onChange={(e) => setCognome(e.target.value)} placeholder="Rossi" />
          </Field>
        </div>
      ) : (
        <Field label="Ragione sociale">
          <Input
            value={ragioneSociale}
            onChange={(e) => setRagioneSociale(e.target.value)}
            placeholder="Esempio S.r.l."
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.it" />
        </Field>
        <Field label="Telefono">
          <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+39 ..." />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tipo === "persona" ? (
          <Field label="Codice fiscale">
            <Input value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} />
          </Field>
        ) : (
          <Field label="Partita IVA">
            <Input value={partitaIva} onChange={(e) => setPartitaIva(e.target.value)} />
          </Field>
        )}
        <Field label="Città">
          <Input value={citta} onChange={(e) => setCitta(e.target.value)} />
        </Field>
      </div>

      <Field label="Indirizzo">
        <Input value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} />
      </Field>

      <Field label="Tag" hint="Separati da virgola, es. Locazioni, Cliente storico">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>

      <Field label="Note">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </Field>
    </div>
  );
}
