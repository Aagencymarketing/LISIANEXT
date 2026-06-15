-- ============================================================
-- LisiaNext — Schema database gestionale (Supabase / Postgres)
-- ------------------------------------------------------------
-- DB NOSTRO (gestionale): profili, clienti, cause, attività,
-- documenti, cronologia, preferiti. Isolamento per-utente (RLS).
-- Il DB SENTENZE è ESTERNO e separato (collegato in seguito).
--
-- Esegui questo file nel SQL Editor del progetto Supabase
-- (o via `supabase db push`). È idempotente: si può rieseguire.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- PROFILI ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  studio text,
  nome_completo text,
  created_at timestamptz not null default now()
);

-- Crea automaticamente il profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome_completo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome_completo', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- CLIENTI ----------
create table if not exists public.clienti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null default 'persona' check (tipo in ('persona','azienda')),
  nome text,
  cognome text,
  ragione_sociale text,
  email text,
  telefono text,
  codice_fiscale text,
  partita_iva text,
  indirizzo text,
  citta text,
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- CAUSE (pratiche) ----------
create table if not exists public.cause (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clienti (id) on delete cascade,
  oggetto text not null,
  materia text not null default 'civile'
    check (materia in ('civile','penale','lavoro','famiglia','tributario','amministrativo','commerciale','altro')),
  controparte text,
  foro text,
  numero_ruolo text,
  stato text not null default 'aperta'
    check (stato in ('aperta','in_corso','sospesa','chiusa_vinta','chiusa_persa','archiviata')),
  valore numeric,
  prossima_udienza timestamptz,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- ATTIVITÀ (storico) ----------
create table if not exists public.attivita (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clienti (id) on delete cascade,
  causa_id uuid references public.cause (id) on delete cascade,
  data timestamptz not null default now(),
  tipo text not null default 'nota'
    check (tipo in ('nota','udienza','deposito','comunicazione','atto','incarico','scadenza','pagamento')),
  titolo text not null,
  descrizione text
);

-- ---------- DOCUMENTI ----------
create table if not exists public.documenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clienti (id) on delete cascade,
  causa_id uuid references public.cause (id) on delete set null,
  nome text not null,
  estensione text not null default 'pdf',
  storage_path text,
  created_at timestamptz not null default now()
);

-- ---------- CRONOLOGIA RICERCHE ----------
create table if not exists public.cronologia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  testo text not null,
  tipo text not null default 'Chat'
    check (tipo in ('Sentenze','Massime','Parere','Atto','Chat')),
  occorrenze int,
  created_at timestamptz not null default now()
);

-- ---------- PREFERITI (sentenze) ----------
create table if not exists public.preferiti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sentenza_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, sentenza_id)
);

-- ---------- INDICI ----------
create index if not exists idx_clienti_user on public.clienti (user_id);
create index if not exists idx_cause_user on public.cause (user_id);
create index if not exists idx_cause_cliente on public.cause (cliente_id);
create index if not exists idx_attivita_user on public.attivita (user_id);
create index if not exists idx_attivita_cliente on public.attivita (cliente_id);
create index if not exists idx_attivita_causa on public.attivita (causa_id);
create index if not exists idx_documenti_user on public.documenti (user_id);
create index if not exists idx_documenti_cliente on public.documenti (cliente_id);
create index if not exists idx_cronologia_user on public.cronologia (user_id);
create index if not exists idx_preferiti_user on public.preferiti (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.clienti    enable row level security;
alter table public.cause      enable row level security;
alter table public.attivita   enable row level security;
alter table public.documenti  enable row level security;
alter table public.cronologia enable row level security;
alter table public.preferiti  enable row level security;

-- PROFILI: l'utente vede/aggiorna solo il proprio profilo
drop policy if exists "profili_select" on public.profiles;
create policy "profili_select" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profili_update" on public.profiles;
create policy "profili_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profili_insert" on public.profiles;
create policy "profili_insert" on public.profiles
  for insert with check (id = auth.uid());

-- Helper: genera le 4 policy CRUD per una tabella con colonna user_id
do $$
declare
  t text;
begin
  foreach t in array array['clienti','cause','attivita','documenti','cronologia','preferiti']
  loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s;', t);
    execute format('create policy "%1$s_select" on public.%1$s for select using (user_id = auth.uid());', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$s;', t);
    execute format('create policy "%1$s_insert" on public.%1$s for insert with check (user_id = auth.uid());', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$s;', t);
    execute format('create policy "%1$s_update" on public.%1$s for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$s;', t);
    execute format('create policy "%1$s_delete" on public.%1$s for delete using (user_id = auth.uid());', t);
  end loop;
end$$;

-- ============================================================
-- STORAGE — bucket privato per i documenti
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documenti', 'documenti', false)
on conflict (id) do nothing;

-- L'utente accede solo ai file sotto il proprio prefisso: documenti/<uid>/...
drop policy if exists "doc_select" on storage.objects;
create policy "doc_select" on storage.objects
  for select using (
    bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "doc_insert" on storage.objects;
create policy "doc_insert" on storage.objects
  for insert with check (
    bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "doc_delete" on storage.objects;
create policy "doc_delete" on storage.objects
  for delete using (
    bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text
  );
