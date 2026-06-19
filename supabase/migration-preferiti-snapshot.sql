-- Preferiti: salva lo SNAPSHOT della sentenza (estremi, testo, ecc.) così le
-- sentenze reali salvate si rivedono sempre, senza dover richiamare l'API
-- (che non espone un "recupera per ID").
-- Esegui nel SQL editor di Supabase. Idempotente.

alter table public.preferiti add column if not exists dati jsonb;
