-- Collegamento delle voci di cronologia al lavoro salvato, così cliccandole
-- si riaprono nella sezione giusta (parere/atto/risposta) con il testo integrale.
alter table public.cronologia add column if not exists conv_id text;
alter table public.cronologia add column if not exists modulo  text;
