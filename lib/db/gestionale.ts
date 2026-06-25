import { createClient } from "@/lib/supabase/client";
import type {
  Cliente,
  Causa,
  Attivita,
  Documento,
} from "@/lib/types";

// ============================================================
// Data-layer gestionale (Supabase). Mappa snake_case (DB) <-> camelCase (app).
// Usato dallo store come fonte di verità (vedi lib/store.ts).
// ============================================================

const db = () => createClient();

/* ---------- mapping DB row -> tipi app ---------- */
/* eslint-disable @typescript-eslint/no-explicit-any */

function toCausa(r: any): Causa {
  return {
    id: r.id,
    oggetto: r.oggetto,
    materia: r.materia,
    controparte: r.controparte ?? undefined,
    foro: r.foro ?? undefined,
    numeroRuolo: r.numero_ruolo ?? undefined,
    stato: r.stato,
    valore: r.valore ?? undefined,
    prossimaUdienza: r.prossima_udienza ?? undefined,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  };
}

function toAttivita(r: any): Attivita {
  return {
    id: r.id,
    causaId: r.causa_id ?? undefined,
    data: r.data,
    tipo: r.tipo,
    titolo: r.titolo,
    descrizione: r.descrizione ?? undefined,
  };
}

function toDocumento(r: any): Documento {
  return {
    id: r.id,
    nome: r.nome,
    estensione: r.estensione,
    causaId: r.causa_id ?? undefined,
    storagePath: r.storage_path ?? undefined,
    createdAt: r.created_at,
  };
}

function toCliente(r: any): Cliente {
  return {
    id: r.id,
    tipo: r.tipo,
    nome: r.nome ?? undefined,
    cognome: r.cognome ?? undefined,
    ragioneSociale: r.ragione_sociale ?? undefined,
    email: r.email ?? undefined,
    telefono: r.telefono ?? undefined,
    codiceFiscale: r.codice_fiscale ?? undefined,
    partitaIva: r.partita_iva ?? undefined,
    indirizzo: r.indirizzo ?? undefined,
    citta: r.citta ?? undefined,
    note: r.note ?? undefined,
    tags: r.tags ?? [],
    createdAt: r.created_at,
    cause: (r.cause ?? []).map(toCausa),
    attivita: (r.attivita ?? []).map(toAttivita),
    documenti: (r.documenti ?? []).map(toDocumento),
  };
}

/* ---------- mapping tipi app -> DB row ---------- */

function clienteRow(c: Partial<Cliente>) {
  const row: Record<string, unknown> = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.tipo !== undefined) row.tipo = c.tipo;
  if (c.nome !== undefined) row.nome = c.nome ?? null;
  if (c.cognome !== undefined) row.cognome = c.cognome ?? null;
  if (c.ragioneSociale !== undefined) row.ragione_sociale = c.ragioneSociale ?? null;
  if (c.email !== undefined) row.email = c.email ?? null;
  if (c.telefono !== undefined) row.telefono = c.telefono ?? null;
  if (c.codiceFiscale !== undefined) row.codice_fiscale = c.codiceFiscale ?? null;
  if (c.partitaIva !== undefined) row.partita_iva = c.partitaIva ?? null;
  if (c.indirizzo !== undefined) row.indirizzo = c.indirizzo ?? null;
  if (c.citta !== undefined) row.citta = c.citta ?? null;
  if (c.note !== undefined) row.note = c.note ?? null;
  if (c.tags !== undefined) row.tags = c.tags ?? [];
  if (c.createdAt !== undefined) row.created_at = c.createdAt;
  return row;
}

function causaRow(clienteId: string, c: Partial<Causa>) {
  const row: Record<string, unknown> = {};
  if (clienteId) row.cliente_id = clienteId;
  if (c.id !== undefined) row.id = c.id;
  if (c.oggetto !== undefined) row.oggetto = c.oggetto;
  if (c.materia !== undefined) row.materia = c.materia;
  if (c.controparte !== undefined) row.controparte = c.controparte ?? null;
  if (c.foro !== undefined) row.foro = c.foro ?? null;
  if (c.numeroRuolo !== undefined) row.numero_ruolo = c.numeroRuolo ?? null;
  if (c.stato !== undefined) row.stato = c.stato;
  if (c.valore !== undefined) row.valore = c.valore ?? null;
  if (c.prossimaUdienza !== undefined) row.prossima_udienza = c.prossimaUdienza ?? null;
  if (c.note !== undefined) row.note = c.note ?? null;
  if (c.createdAt !== undefined) row.created_at = c.createdAt;
  return row;
}

function attivitaRow(clienteId: string, a: Partial<Attivita>) {
  const row: Record<string, unknown> = {};
  if (clienteId) row.cliente_id = clienteId;
  if (a.id !== undefined) row.id = a.id;
  if (a.causaId !== undefined) row.causa_id = a.causaId ?? null;
  if (a.data !== undefined) row.data = a.data;
  if (a.tipo !== undefined) row.tipo = a.tipo;
  if (a.titolo !== undefined) row.titolo = a.titolo;
  if (a.descrizione !== undefined) row.descrizione = a.descrizione ?? null;
  return row;
}

function documentoRow(clienteId: string, d: Partial<Documento> & { storagePath?: string }) {
  const row: Record<string, unknown> = {};
  if (clienteId) row.cliente_id = clienteId;
  if (d.id !== undefined) row.id = d.id;
  if (d.causaId !== undefined) row.causa_id = d.causaId ?? null;
  if (d.nome !== undefined) row.nome = d.nome;
  if (d.estensione !== undefined) row.estensione = d.estensione;
  if (d.storagePath !== undefined) row.storage_path = d.storagePath ?? null;
  if (d.createdAt !== undefined) row.created_at = d.createdAt;
  return row;
}

/* ---------- API ---------- */

/** Carica tutti i clienti dell'utente con cause/attività/documenti annidati. */
export async function caricaClienti(): Promise<Cliente[]> {
  const { data, error } = await db()
    .from("clienti")
    .select("*, cause(*), attivita(*), documenti(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toCliente);
}

export async function insertCliente(c: Cliente) {
  const { error } = await db().from("clienti").insert(clienteRow(c));
  if (error) throw error;
}

export async function updateClienteDb(id: string, patch: Partial<Cliente>) {
  const { error } = await db().from("clienti").update(clienteRow(patch)).eq("id", id);
  if (error) throw error;
}

export async function deleteClienteDb(id: string) {
  const { error } = await db().from("clienti").delete().eq("id", id);
  if (error) throw error;
}

export async function insertCausa(clienteId: string, c: Causa) {
  const { error } = await db().from("cause").insert(causaRow(clienteId, c));
  if (error) throw error;
}

export async function updateCausaDb(causaId: string, patch: Partial<Causa>) {
  const { error } = await db().from("cause").update(causaRow("", patch)).eq("id", causaId);
  if (error) throw error;
}

export async function deleteCausaDb(causaId: string) {
  const { error } = await db().from("cause").delete().eq("id", causaId);
  if (error) throw error;
}

export async function insertAttivita(clienteId: string, a: Attivita) {
  const { error } = await db().from("attivita").insert(attivitaRow(clienteId, a));
  if (error) throw error;
}

export async function deleteAttivitaDb(attivitaId: string) {
  const { error } = await db().from("attivita").delete().eq("id", attivitaId);
  if (error) throw error;
}

export async function insertDocumento(
  clienteId: string,
  d: Documento & { storagePath?: string },
) {
  const { error } = await db().from("documenti").insert(documentoRow(clienteId, d));
  if (error) throw error;
}

export async function updateDocumentoDb(docId: string, patch: { causaId?: string | null }) {
  const row: Record<string, unknown> = {};
  if ("causaId" in patch) row.causa_id = patch.causaId ?? null;
  const { error } = await db().from("documenti").update(row).eq("id", docId);
  if (error) throw error;
}

export async function deleteDocumentoDb(docId: string) {
  const { error } = await db().from("documenti").delete().eq("id", docId);
  if (error) throw error;
}
