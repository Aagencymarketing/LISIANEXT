"use client";

import { useApp } from "@/lib/store";
import { nomeCliente } from "@/lib/types";
import { Field, Select } from "@/components/ui";
import { Link2 } from "lucide-react";

export function ContextPicker({
  clienteId,
  causaId,
  onCliente,
  onCausa,
}: {
  clienteId?: string;
  causaId?: string;
  onCliente: (id?: string) => void;
  onCausa: (id?: string) => void;
}) {
  const clienti = useApp((s) => s.clienti);
  const cliente = clienti.find((c) => c.id === clienteId);

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
        <Link2 size={15} /> Collega a una pratica (opzionale)
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cliente">
          <Select
            value={clienteId || ""}
            onChange={(e) => {
              onCliente(e.target.value || undefined);
              onCausa(undefined);
            }}
          >
            <option value="">Nessuno</option>
            {clienti.map((c) => (
              <option key={c.id} value={c.id}>
                {nomeCliente(c)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Pratica">
          <Select
            value={causaId || ""}
            onChange={(e) => onCausa(e.target.value || undefined)}
            disabled={!cliente || cliente.cause.length === 0}
          >
            <option value="">{cliente ? "Nessuna" : "Seleziona un cliente"}</option>
            {cliente?.cause.map((ca) => (
              <option key={ca.id} value={ca.id}>
                {ca.oggetto}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}
