-- Sentenze salvate nel fascicolo di un cliente (snapshot della sentenza).
create table if not exists public.sentenze_cliente (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clienti (id) on delete cascade,
  sentenza_id text not null,
  dati jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, cliente_id, sentenza_id)
);

create index if not exists idx_sentenze_cliente_user on public.sentenze_cliente (user_id);
create index if not exists idx_sentenze_cliente_cliente on public.sentenze_cliente (cliente_id);

alter table public.sentenze_cliente enable row level security;

drop policy if exists "sentenze_cliente_select" on public.sentenze_cliente;
create policy "sentenze_cliente_select" on public.sentenze_cliente
  for select using (user_id = auth.uid());
drop policy if exists "sentenze_cliente_insert" on public.sentenze_cliente;
create policy "sentenze_cliente_insert" on public.sentenze_cliente
  for insert with check (user_id = auth.uid());
drop policy if exists "sentenze_cliente_delete" on public.sentenze_cliente;
create policy "sentenze_cliente_delete" on public.sentenze_cliente
  for delete using (user_id = auth.uid());
