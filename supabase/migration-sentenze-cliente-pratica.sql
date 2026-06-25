-- Collega una sentenza salvata a una pratica del cliente (oltre che al cliente).
alter table public.sentenze_cliente
  add column if not exists causa_id uuid references public.cause (id) on delete set null;

create index if not exists idx_sentenze_cliente_causa on public.sentenze_cliente (causa_id);
