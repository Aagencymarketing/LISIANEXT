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
} from "./types";
import { CLIENTI_SEED, CRONOLOGIA_SEED, CONVERSAZIONI_SEED } from "./seed";
import { uid, oggi } from "./utils";

type Theme = "light" | "dark";

interface AppState {
  // ---- dati (DB gestionale locale) ----
  clienti: Cliente[];
  conversazioni: ConversazioneAI[];
  cronologia: VoceCronologia[];
  preferiti: string[];

  // ---- UI ----
  theme: Theme;
  sidebarCollapsed: boolean;
  hasHydrated: boolean;

  // ---- azioni clienti ----
  addCliente: (c: Omit<Cliente, "id" | "createdAt" | "cause" | "attivita" | "documenti">) => string;
  updateCliente: (id: string, patch: Partial<Cliente>) => void;
  removeCliente: (id: string) => void;
  getCliente: (id: string) => Cliente | undefined;

  // ---- cause ----
  addCausa: (clienteId: string, c: Omit<Causa, "id" | "createdAt">) => string;
  updateCausa: (clienteId: string, causaId: string, patch: Partial<Causa>) => void;
  removeCausa: (clienteId: string, causaId: string) => void;

  // ---- attività (storico) ----
  addAttivita: (clienteId: string, a: Omit<Attivita, "id">) => void;
  removeAttivita: (clienteId: string, attivitaId: string) => void;

  // ---- documenti ----
  addDocumento: (clienteId: string, d: Omit<Documento, "id" | "createdAt">) => void;
  removeDocumento: (clienteId: string, docId: string) => void;

  // ---- AI / cronologia ----
  addConversazione: (c: ConversazioneAI) => void;
  addCronologia: (v: Omit<VoceCronologia, "id" | "createdAt">) => void;
  togglePreferito: (id: string) => void;

  // ---- UI azioni ----
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setHasHydrated: (v: boolean) => void;
  resetDemo: () => void;
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
      clienti: CLIENTI_SEED,
      conversazioni: CONVERSAZIONI_SEED,
      cronologia: CRONOLOGIA_SEED,
      preferiti: [],

      theme: "light",
      sidebarCollapsed: false,
      hasHydrated: false,

      addCliente: (c) => {
        const id = uid("cli");
        const nuovo: Cliente = {
          ...c,
          id,
          createdAt: oggi(),
          cause: [],
          attivita: [],
          documenti: [],
        };
        set((s) => ({ clienti: [nuovo, ...s.clienti] }));
        return id;
      },

      updateCliente: (id, patch) =>
        set((s) => ({
          clienti: mutaCliente(s.clienti, id, (c) => ({ ...c, ...patch })),
        })),

      removeCliente: (id) =>
        set((s) => ({ clienti: s.clienti.filter((c) => c.id !== id) })),

      getCliente: (id) => get().clienti.find((c) => c.id === id),

      addCausa: (clienteId, c) => {
        const id = uid("cau");
        const nuova: Causa = { ...c, id, createdAt: oggi() };
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            cause: [nuova, ...cl.cause],
            attivita: [
              {
                id: uid("att"),
                causaId: id,
                data: oggi(),
                tipo: "incarico",
                titolo: "Nuova pratica creata",
                descrizione: c.oggetto,
              },
              ...cl.attivita,
            ],
          })),
        }));
        return id;
      },

      updateCausa: (clienteId, causaId, patch) =>
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            cause: cl.cause.map((ca) =>
              ca.id === causaId ? { ...ca, ...patch } : ca,
            ),
          })),
        })),

      removeCausa: (clienteId, causaId) =>
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            cause: cl.cause.filter((ca) => ca.id !== causaId),
            attivita: cl.attivita.filter((a) => a.causaId !== causaId),
          })),
        })),

      addAttivita: (clienteId, a) =>
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            attivita: [{ ...a, id: uid("att") }, ...cl.attivita],
          })),
        })),

      removeAttivita: (clienteId, attivitaId) =>
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            attivita: cl.attivita.filter((a) => a.id !== attivitaId),
          })),
        })),

      addDocumento: (clienteId, d) =>
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            documenti: [{ ...d, id: uid("doc"), createdAt: oggi() }, ...cl.documenti],
          })),
        })),

      removeDocumento: (clienteId, docId) =>
        set((s) => ({
          clienti: mutaCliente(s.clienti, clienteId, (cl) => ({
            ...cl,
            documenti: cl.documenti.filter((dd) => dd.id !== docId),
          })),
        })),

      addConversazione: (c) =>
        set((s) => ({ conversazioni: [c, ...s.conversazioni] })),

      addCronologia: (v) =>
        set((s) => ({
          cronologia: [
            { ...v, id: uid("cr"), createdAt: oggi() },
            ...s.cronologia,
          ].slice(0, 100),
        })),

      togglePreferito: (id) =>
        set((s) => ({
          preferiti: s.preferiti.includes(id)
            ? s.preferiti.filter((p) => p !== id)
            : [id, ...s.preferiti],
        })),

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setHasHydrated: (v) => set({ hasHydrated: v }),

      resetDemo: () =>
        set({
          clienti: CLIENTI_SEED,
          conversazioni: CONVERSAZIONI_SEED,
          cronologia: CRONOLOGIA_SEED,
          preferiti: [],
        }),
    }),
    {
      name: "lisianext-demo",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        clienti: s.clienti,
        conversazioni: s.conversazioni,
        cronologia: s.cronologia,
        preferiti: s.preferiti,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
