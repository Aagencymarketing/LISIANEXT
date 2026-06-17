-- ============================================================
-- LisiaNext — Migrazione: tabella CONVERSAZIONI AI
-- ------------------------------------------------------------
-- Salva chat (Risposta immediata), pareri e atti generati,
-- riapribili e collegabili a un cliente/pratica. Per-utente (RLS).
-- Eseguire nel SQL Editor del progetto Supabase. Idempotente.
-- ============================================================

create table if not exists public.conversazioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  modulo text not null default 'risposta_immediata'
    check (modulo in ('risposta_immediata','pareri','redattore','ricerche')),
  titolo text not null,
  messaggi jsonb not null default '[]'::jsonb,
  cliente_id uuid references public.clienti (id) on delete set null,
  causa_id uuid references public.cause (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversazioni_user on public.conversazioni (user_id);
create index if not exists idx_conversazioni_cliente on public.conversazioni (cliente_id);
create index if not exists idx_conversazioni_modulo on public.conversazioni (modulo);

alter table public.conversazioni enable row level security;

drop policy if exists "conversazioni_select" on public.conversazioni;
create policy "conversazioni_select" on public.conversazioni
  for select using (user_id = auth.uid());
drop policy if exists "conversazioni_insert" on public.conversazioni;
create policy "conversazioni_insert" on public.conversazioni
  for insert with check (user_id = auth.uid());
drop policy if exists "conversazioni_update" on public.conversazioni;
create policy "conversazioni_update" on public.conversazioni
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "conversazioni_delete" on public.conversazioni;
create policy "conversazioni_delete" on public.conversazioni
  for delete using (user_id = auth.uid());
