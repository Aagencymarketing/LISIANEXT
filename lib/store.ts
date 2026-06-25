"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Cliente,
  Causa,
  Attivita,
  Documento,
  ConversazioneAI,
  VoceCronologia,
  SentenzaRisultato,
  SentenzaCliente,
} from "./types";
import { CLIENTI_SEED } from "./seed";
import { uuid, oggi } from "./utils";
import * as gdb from "./db/gestionale";
import { caricaCronologia, insertCronologia } from "./db/cronologia";
import { caricaPreferiti, addPreferitoDb, removePreferitoDb } from "./db/preferiti";
import {
  caricaSentenzeCliente,
  addSentenzaClienteDb,
  removeSentenzaClienteDb,
} from "./db/sentenzeCliente";
import {
  caricaConversazioni,
  insertConversazione,
  updateConversazioneDb,
  deleteConversazioneDb,
} from "./db/conversazioni";

type Theme = "light" | "dark";

// Esegue una scrittura su Supabase senza bloccare la UI (ottimistica).
function persistWrite(p: Promise<unknown>) {
  p.catch((e) => console.error("[supabase]", e));
}

interface AppState {
  // ---- dati (DB gestionale su Supabase, cache locale) ----
  clienti: Cliente[];
  conversazioni: ConversazioneAI[];
  cronologia: VoceCronologia[];
  preferiti: SentenzaRisultato[];
  sentenzeCliente: SentenzaCliente[];
  dataLoaded: boolean;

  // ---- UI (persistite in localStorage) ----
  theme: Theme;
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  hasHydrated: boolean;

  // ---- sincronizzazione ----
  hydrateFromSupabase: () => Promise<void>;
  clearLocal: () => void;
  caricaEsempi: () => Promise<void>;

  // ---- azioni clienti ----
  addCliente: (
    c: Omit<Cliente, "id" | "createdAt" | "cause" | "attivita" | "documenti">,
  ) => string;
  updateCliente: (id: string, patch: Partial<Cliente>) => void;
  removeCliente: (id: string) => void;
  getCliente: (id: string) => Cliente | undefined;

  // ---- cause ----
  addCausa: (clienteId: string, c: Omit<Causa, "id" | "createdAt">) => string;
  updateCausa: (clienteId: string, causaId: string, patch: Partial<Causa>) => void;
  removeCausa: (clienteId: string, causaId: string) => void;

  // ---- attività ----
  addAttivita: (clienteId: string, a: Omit<Attivita, "id">) => void;
  removeAttivita: (clienteId: string, attivitaId: string) => void;

  // ---- documenti ----
  addDocumento: (
    clienteId: string,
    d: Omit<Documento, "id" | "createdAt">,
    storagePath?: string,
  ) => void;
  updateDocumento: (clienteId: string, docId: string, patch: { causaId?: string }) => void;
  removeDocumento: (clienteId: string, docId: string) => void;

  // ---- AI / cronologia ----
  addConversazione: (c: ConversazioneAI) => void;
  updateConversazione: (id: string, patch: Partial<ConversazioneAI>) => void;
  removeConversazione: (id: string) => void;
  addCronologia: (v: Omit<VoceCronologia, "id" | "createdAt">) => void;
  togglePreferito: (sentenza: SentenzaRisultato) => void;
  addSentenzaCliente: (clienteId: string, sentenza: SentenzaRisultato) => void;
  removeSentenzaCliente: (id: string) => void;

  // ---- UI azioni ----
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleAiPanel: () => void;
  setHasHydrated: (v: boolean) => void;
}

function mutaCliente(
  clienti: Cliente[],
  id: string,
  fn: (c: Cliente) => Cliente,
): Cliente[] {
  return clienti.map((c) => (c.id === id ? fn(c) : c));
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      clienti: [],
      conversazioni: [],
      cronologia: [],
      preferiti: [],
      sentenzeCliente: [],
      dataLoaded: false,

      theme: "light",
      sidebarCollapsed: false,
      aiPanelOpen: true,
      hasHydrated: false,

      hydrateFromSupabase: async () => {
        // Ogni risorsa è caricata in modo indipendente: il fallimento di una
        // (es. tabella non ancora migrata) non blocca le altre.
        const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
          try {
            return await p;
          } catch (e) {
            console.error("[supabase] hydrate", e);
            return fallback;
          }
        };
        const [clienti, cronologia, preferiti, conversazioni, sentenzeCliente] = await Promise.all([
          safe(gdb.caricaClienti(), [] as Cliente[]),
          safe(caricaCronologia(), [] as VoceCronologia[]),
          safe(caricaPreferiti(), [] as SentenzaRisultato[]),
          safe(caricaConversazioni(), [] as ConversazioneAI[]),
          safe(caricaSentenzeCliente(), [] as SentenzaCliente[]),
        ]);
        set({ clienti, cronologia, preferiti, conversazioni, sentenzeCliente, dataLoaded: true });
      },

      clearLocal: () =>
        set({ clienti: [], conversazioni: [], cronologia: [], preferiti: [], sentenzeCliente: [], dataLoaded: false }),

      caricaEsempi: async () => {
        for (const seed of CLIENTI_SEED) {
          const clienteId = uuid();
          const causaMap = new Map<string, string>();
          const cause: Causa[] = seed.cause.map((c) => {
            const nid = uuid();
            causaMap.set(c.id, nid);
            return { ...c, id: nid };
          });
          const attivita: Attivita[] = seed.attivita.map((a) => ({
            ...a,
            id: uuid(),
            causaId: a.causaId ? causaMap.get(a.causaId) : undefined,
          }));
          const documenti: Documento[] = seed.documenti.map((d) => ({
            ...d,
            id: uuid(),
            causaId: d.causaId ? causaMap.get(d.causaId) : undefined,
          }));
          const cliente: Cliente = { ...seed, id: clienteId, cause, attivita, documenti };
          set((s) => ({ clienti: [cliente, ...s.clienti] }));
          try {
            await gdb.insertCliente(cliente);
            for (const c of cause) await gdb.insertCausa(clienteId, c);
            for (const a of attivita) await gdb.insertAttivita(clienteId, a);
            for (const d of documenti) await gdb.insertDocumento(clienteId, d);
          } catch (e) {
            console.error("[supabase] esempi", e);
          }
        }
      },

      addCliente: (c) => {
        const id = uuid();
        const nuovo: Cliente = {
          ...c,
          id,
          createdAt: oggi(),
          cause: [],
          attivita: [],
          documenti: [],
        };
        set((s) => ({ clienti: [nuovo, ...s.clienti] }));
        persistWrite(gdb.insertCliente(nuovo));
        return id;
      },

      updateCliente: (id, patch) => {
        set((s) => ({ clienti: mutaCliente(s.clienti, id, (c) => ({ ...c, ...patch })) }));
        persistWrite(gdb.updateClienteDb(id, patch));
      },

      removeCliente: (id) => {
        set((s) => ({ clienti: s.clienti.filter((c) => c.id !== id) }));
        persistWrite(gdb.deleteClienteDb(id));
      },

      getCliente: (id) => get().clienti.find((c) => c.id === id),

      addCausa: (clienteId, c) => {
        const id = uuid();
        const nuova: Causa = { ...c, id, createdAt: oggi() };
        const att: Attivita = {
          id: uuid(),
          causaId: id,
          data: oggi(),
          tipo: "incarico",
          titolo: "Nuova pratica creata",
          descrizione: c.oggetto,
        };
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            cause: [nuova, ...cl.cause],
            attivita: [att, ...cl.attivita],
          })),
        }));
        persistWrite(gdb.insertCausa(clienteId, nuova));
        persistWrite(gdb.insertAttivita(clienteId, att));
        return id;
      },

      updateCausa: (clienteId, causaId, patch) => {
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            cause: cl.cause.map((ca) => (ca.id === causaId ? { ...ca, ...patch } : ca)),
          })),
        }));
        persistWrite(gdb.updateCausaDb(causaId, patch));
      },

      removeCausa: (clienteId, causaId) => {
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            cause: cl.cause.filter((ca) => ca.id !== causaId),
            attivita: cl.attivita.filter((a) => a.causaId !== causaId),
          })),
        }));
        persistWrite(gdb.deleteCausaDb(causaId));
      },

      addAttivita: (clienteId, a) => {
        const nuova: Attivita = { ...a, id: uuid() };
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            attivita: [nuova, ...cl.attivita],
          })),
        }));
        persistWrite(gdb.insertAttivita(clienteId, nuova));
      },

      removeAttivita: (clienteId, attivitaId) => {
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            attivita: cl.attivita.filter((a) => a.id !== attivitaId),
          })),
        }));
        persistWrite(gdb.deleteAttivitaDb(attivitaId));
      },

      addDocumento: (clienteId, d, storagePath) => {
        const nuovo: Documento = { ...d, id: uuid(), createdAt: oggi(), storagePath };
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            documenti: [nuovo, ...cl.documenti],
          })),
        }));
        persistWrite(gdb.insertDocumento(clienteId, nuovo));
      },

      updateDocumento: (clienteId, docId, patch) => {
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            documenti: cl.documenti.map((dd) =>
              dd.id === docId ? { ...dd, ...patch } : dd,
            ),
          })),
        }));
        persistWrite(gdb.updateDocumentoDb(docId, { causaId: patch.causaId ?? null }));
      },

      removeDocumento: (clienteId, docId) => {
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            documenti: cl.documenti.filter((dd) => dd.id !== docId),
          })),
        }));
        persistWrite(gdb.deleteDocumentoDb(docId));
      },

      addConversazione: (c) => {
        set((s) => ({ conversazioni: [c, ...s.conversazioni] }));
        persistWrite(insertConversazione(c));
      },

      updateConversazione: (id, patch) => {
        set((s) => ({
          conversazioni: s.conversazioni.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: oggi() } : c,
          ),
        }));
        persistWrite(updateConversazioneDb(id, patch));
      },

      removeConversazione: (id) => {
        set((s) => ({ conversazioni: s.conversazioni.filter((c) => c.id !== id) }));
        persistWrite(deleteConversazioneDb(id));
      },

      addCronologia: (v) => {
        const nuova: VoceCronologia = { ...v, id: uuid(), createdAt: oggi() };
        set((s) => ({ cronologia: [nuova, ...s.cronologia].slice(0, 100) }));
        persistWrite(insertCronologia(nuova));
      },

      togglePreferito: (sentenza) => {
        const presente = get().preferiti.some((p) => p.id === sentenza.id);
        set((s) => ({
          preferiti: presente
            ? s.preferiti.filter((p) => p.id !== sentenza.id)
            : [sentenza, ...s.preferiti],
        }));
        persistWrite(presente ? removePreferitoDb(sentenza.id) : addPreferitoDb(sentenza));
      },

      addSentenzaCliente: (clienteId, sentenza) => {
        // niente duplicati della stessa sentenza per lo stesso cliente
        if (get().sentenzeCliente.some((x) => x.clienteId === clienteId && x.sentenza.id === sentenza.id)) return;
        const rec: SentenzaCliente = { id: uuid(), clienteId, sentenza, createdAt: oggi() };
        set((s) => ({ sentenzeCliente: [rec, ...s.sentenzeCliente] }));
        persistWrite(addSentenzaClienteDb(rec));
      },

      removeSentenzaCliente: (id) => {
        set((s) => ({ sentenzeCliente: s.sentenzeCliente.filter((x) => x.id !== id) }));
        persistWrite(removeSentenzaClienteDb(id));
      },

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "lisianext-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        aiPanelOpen: s.aiPanelOpen,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
