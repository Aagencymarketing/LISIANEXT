# LisiaNext — Legal AI (ricostruzione)

Piattaforma legale con AI ricostruita da zero (Next.js 16 App Router + TypeScript + Tailwind v4).
Per ora **demo/anteprima** da presentare ai proprietari; deploy finale su **Vercel**.

## Comandi
- `npm run dev` — sviluppo (porta 3000)
- `npm run build` — build di produzione
- `npm run lint`

## Architettura
- `app/(app)/` — tutte le pagine sotto il layout con sidebar+topbar (`components/layout/AppShell.tsx`)
- `components/` — UI (`ui.tsx`), layout, AI, gestionale
- `lib/` — dominio: `types.ts`, `store.ts` (zustand + persist su localStorage), `seed.ts`, `labels.ts`, `utils.ts`
- `lib/ai/` — `mock.ts` (AI simulata) e `sentenze.ts` (DB sentenze esterno, stub)

## DUE DATABASE (concetto chiave — sono separati)
1. **DB GESTIONALE** (nostro): clienti, pratiche, storico, documenti.
   - In demo vive in `localStorage` via `lib/store.ts`.
   - Da sostituire con DB reale (es. Supabase/Postgres) se il progetto viene confermato:
     basta rimpiazzare le azioni dello store con chiamate API/DB mantenendo le firme.
2. **DB SENTENZE** (esterno LisiaNext): 6,5M+ sentenze reali, aggiornato ogni 24h.
   - Lo collega il vecchio sviluppatore. Punto di aggancio unico: `lib/ai/sentenze.ts`
     → funzione `cercaSentenze()` + flag `SENTENZE_COLLEGATO`. Vedi nota in cima al file.
I due DB devono comunicare: l'AI interroga il DB sentenze per trovare precedenti coerenti
con la pratica del cliente (già implementato lato UI in `components/gestionale/ClienteAI.tsx`).

## AI
- Tutte le interfacce AI funzionano con risposte **simulate** (`lib/ai/mock.ts`, streaming token-by-token).
- Per collegare Claude reale: sostituire `generaRisposta()` con una chiamata all'Anthropic API
  mantenendo la firma; il resto della UI non va toccato. Flag `AI_COLLEGATO`.

## Da fornire
- Logo ufficiale (placeholder in `components/Logo.tsx`).
- Credenziali/endpoint dei due database.

## Note demo
- "Ripristina dati demo" in Impostazioni per azzerare lo stato locale.
- Sezione "Gestionale" sostituisce la vecchia "Casi & Cartelle".
