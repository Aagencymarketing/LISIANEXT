import type {
  StatoCausa,
  MateriaCausa,
  TipoAttivita,
} from "./types";

export const STATO_CAUSA: Record<
  StatoCausa,
  { label: string; tone: "blue" | "amber" | "gray" | "green" | "red" }
> = {
  aperta: { label: "Aperta", tone: "blue" },
  in_corso: { label: "In corso", tone: "amber" },
  sospesa: { label: "Sospesa", tone: "gray" },
  chiusa_vinta: { label: "Vinta", tone: "green" },
  chiusa_persa: { label: "Persa", tone: "red" },
  archiviata: { label: "Archiviata", tone: "gray" },
};

export const MATERIA_CAUSA: Record<MateriaCausa, string> = {
  civile: "Civile",
  penale: "Penale",
  lavoro: "Lavoro",
  famiglia: "Famiglia",
  tributario: "Tributario",
  amministrativo: "Amministrativo",
  commerciale: "Commerciale",
  altro: "Altro",
};

export const TIPO_ATTIVITA: Record<
  TipoAttivita,
  { label: string; tone: "blue" | "amber" | "gray" | "green" | "red" | "violet" }
> = {
  nota: { label: "Nota", tone: "gray" },
  udienza: { label: "Udienza", tone: "violet" },
  deposito: { label: "Deposito", tone: "blue" },
  comunicazione: { label: "Comunicazione", tone: "blue" },
  atto: { label: "Atto", tone: "violet" },
  incarico: { label: "Incarico", tone: "green" },
  scadenza: { label: "Scadenza", tone: "amber" },
  pagamento: { label: "Pagamento", tone: "green" },
};

export const TIPI_ATTO = [
  "Atto di citazione",
  "Comparsa di costituzione e risposta",
  "Ricorso",
  "Memoria difensiva",
  "Atto di precetto",
  "Diffida / Messa in mora",
  "Appello",
  "Ricorso per cassazione",
  "Contratto",
  "Parere motivato",
  "Altro",
] as const;
