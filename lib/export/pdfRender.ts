// Motore di layout PDF (puro: nessuna API del browser → testabile in Node).
// Disegna il markdown del parere/atto su un documento jsPDF impaginato (A4),
// con testo selezionabile, intestazione, tabelle, liste e numeri di pagina.
// Usato da lib/export/pdf.ts (lato client) per il download del PDF.

import { parseBlocks, type Run } from "./markdown";

// jsPDF è tipizzato in modo lasco qui per evitare di dipendere dai tipi nel core.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

const PT = 0.352778; // 1pt in mm
const PAGE = { w: 210, h: 297 };
const M = { top: 20, bottom: 18, left: 20, right: 20 };
const CONTENT_W = PAGE.w - M.left - M.right;
const RIGHT = M.left + CONTENT_W;

const SIZE = { title: 14, h1: 13, h2: 12, h3: 11, h4: 10.5, body: 10.5, table: 9.5, footer: 8 };
const FACTOR = 1.34;

const lh = (sizePt: number) => sizePt * PT * FACTOR;
const ascent = (sizePt: number) => sizePt * PT * 0.82;

// jsPDF + font standard (helvetica) gestiscono il set WinAnsi (accenti, €, —, virgolette).
// Normalizziamo solo i caratteri fuori da quel set per evitare glifi rotti.
function safe(s: string): string {
  return s
    .replace(/ /g, " ") // nbsp
    .replace(/ /g, " ") // narrow nbsp
    .replace(/‑/g, "-") // non-breaking hyphen
    .replace(/ | | /g, " "); // thin spaces
}

interface Cursor {
  doc: Doc;
  y: number;
}

function setFont(doc: Doc, sizePt: number, bold?: boolean, italic?: boolean) {
  const style = bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";
  doc.setFont("helvetica", style);
  doc.setFontSize(sizePt);
}

function ensure(cur: Cursor, h: number) {
  if (cur.y + h > PAGE.h - M.bottom) {
    cur.doc.addPage();
    cur.y = M.top;
  }
}

interface Parola {
  t: string;
  b: boolean;
  i: boolean;
  w: number;
}

/**
 * Disegna una sequenza di run (con grassetto/corsivo inline) con a-capo
 * automatico. Con `justify` i paragrafi sono giustificati (tranne l'ultima riga).
 */
function flowRuns(
  cur: Cursor,
  runs: Run[],
  opt: { size: number; bold?: boolean; italic?: boolean; x0?: number; x1?: number; justify?: boolean },
) {
  const { doc } = cur;
  const size = opt.size;
  const x0 = opt.x0 ?? M.left;
  const x1 = opt.x1 ?? M.left;
  const lineH = lh(size);

  // Tokenizza in parole con stile e larghezza.
  const parole: Parola[] = [];
  for (const r of runs) {
    const b = !!r.bold || !!opt.bold;
    const i = !!r.italic || !!opt.italic;
    for (const w of safe(r.text).split(/\s+/)) {
      if (w === "") continue;
      setFont(doc, size, b, i);
      parole.push({ t: w, b, i, w: doc.getTextWidth(w) });
    }
  }
  if (parole.length === 0) {
    cur.y += lineH;
    return;
  }

  setFont(doc, size, false, false);
  const spazio = doc.getTextWidth(" ");

  // Spezza in righe (greedy), considerando il margine sinistro diverso per la
  // prima riga (x0) e per le successive (x1).
  const righe: Parola[][] = [];
  let riga: Parola[] = [];
  let usata = 0;
  for (const p of parole) {
    const left = righe.length === 0 ? x0 : x1;
    const avail = RIGHT - left;
    const add = (riga.length === 0 ? 0 : spazio) + p.w;
    if (riga.length > 0 && usata + add > avail) {
      righe.push(riga);
      riga = [p];
      usata = p.w;
    } else {
      riga.push(p);
      usata += add;
    }
  }
  if (riga.length) righe.push(riga);

  // Render riga per riga.
  for (let li = 0; li < righe.length; li++) {
    ensure(cur, lineH);
    const left = li === 0 ? x0 : x1;
    const r = righe[li];
    const ultima = li === righe.length - 1;
    let gap = spazio;
    if (opt.justify && !ultima && r.length > 1) {
      const larghParole = r.reduce((a, p) => a + p.w, 0);
      gap = (RIGHT - left - larghParole) / (r.length - 1);
      if (gap < spazio) gap = spazio; // niente giustificazione "compressa"
    }
    let x = left;
    for (const p of r) {
      setFont(doc, size, p.b, p.i);
      doc.text(p.t, x, cur.y + ascent(size));
      x += p.w + gap;
    }
    cur.y += lineH;
  }
}

function heading(cur: Cursor, runs: Run[], level: number) {
  const size = level === 1 ? SIZE.h1 : level === 2 ? SIZE.h2 : level === 3 ? SIZE.h3 : SIZE.h4;
  cur.y += level <= 2 ? 3.2 : 2.2;
  ensure(cur, lh(size));
  flowRuns(cur, runs, { size, bold: true });
  cur.y += 1.2;
}

function listItem(cur: Cursor, runs: Run[], marker: string) {
  const indent = 6;
  setFont(cur.doc, SIZE.body, false, false);
  const mw = cur.doc.getTextWidth(marker);
  const lineH = lh(SIZE.body);
  ensure(cur, lineH);
  // marcatore sulla prima riga
  cur.doc.text(marker, M.left + indent, cur.y + ascent(SIZE.body));
  flowRuns(cur, runs, {
    size: SIZE.body,
    x0: M.left + indent + mw,
    x1: M.left + indent + mw,
  });
}

function hr(cur: Cursor) {
  cur.y += 1.5;
  ensure(cur, 3);
  cur.doc.setDrawColor(190);
  cur.doc.setLineWidth(0.2);
  cur.doc.line(M.left, cur.y, RIGHT, cur.y);
  cur.y += 3;
}

function plain(runs: Run[]): string {
  return safe(runs.map((r) => r.text).join(""));
}

function table(cur: Cursor, header: Run[][], rows: Run[][][]) {
  const { doc } = cur;
  const cols = Math.max(1, header.length);
  const colW = CONTENT_W / cols;
  const pad = 1.8;
  const cellLineH = lh(SIZE.table);

  const drawRow = (cells: Run[][], bold: boolean) => {
    setFont(doc, SIZE.table, bold);
    const linesPer = cells.map((c) => doc.splitTextToSize(plain(c), colW - 2 * pad) as string[]);
    const maxLines = Math.max(1, ...linesPer.map((l) => l.length));
    const rowH = maxLines * cellLineH + 2 * pad;
    ensure(cur, rowH);
    const yTop = cur.y;
    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    for (let c = 0; c < cols; c++) {
      const x = M.left + c * colW;
      doc.rect(x, yTop, colW, rowH);
      const lines = linesPer[c] || [];
      lines.forEach((ln, idx) => {
        doc.text(ln, x + pad, yTop + pad + ascent(SIZE.table) + idx * cellLineH);
      });
    }
    cur.y = yTop + rowH;
  };

  cur.y += 1.5;
  drawRow(header, true);
  for (const r of rows) {
    // se la riga non entra, nuova pagina + intestazione ripetuta
    setFont(doc, SIZE.table, false);
    const linesPer = r.map((c) => (doc.splitTextToSize(plain(c), colW - 2 * pad) as string[]).length);
    const rowH = Math.max(1, ...linesPer) * cellLineH + 2 * pad;
    if (cur.y + rowH > PAGE.h - M.bottom) {
      doc.addPage();
      cur.y = M.top;
      drawRow(header, true);
    }
    drawRow(r, false);
  }
  cur.y += 2.5;
}

function footer(doc: Doc, titolo: string) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    setFont(doc, SIZE.footer, false);
    doc.setTextColor(150);
    doc.text("Lisia Legal AI / LisiaNext", M.left, PAGE.h - 10);
    doc.text(`Pag. ${p} di ${total}`, RIGHT, PAGE.h - 10, { align: "right" });
    doc.setTextColor(20);
  }
}

/** Disegna l'intero documento (titolo + markdown) sul doc jsPDF fornito. */
export function renderPdf(doc: Doc, titolo: string, markdown: string) {
  doc.setTextColor(20);
  const cur: Cursor = { doc, y: M.top };

  // Titolo (oggetto/quesito) in cima, con linea di separazione.
  if (titolo && titolo.trim()) {
    flowRuns(cur, [{ text: titolo.trim(), bold: true }], { size: SIZE.title, bold: true });
    cur.y += 1;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(M.left, cur.y, RIGHT, cur.y);
    cur.y += 3.5;
  }

  for (const b of parseBlocks(markdown)) {
    if (b.type === "h") heading(cur, b.runs, b.level);
    else if (b.type === "p") {
      flowRuns(cur, b.runs, { size: SIZE.body, justify: true });
      cur.y += 1.4;
    } else if (b.type === "ul") {
      for (const it of b.items) listItem(cur, it, "•  ");
      cur.y += 1.4;
    } else if (b.type === "ol") {
      b.items.forEach((it, idx) => listItem(cur, it, `${idx + 1}.  `));
      cur.y += 1.4;
    } else if (b.type === "hr") hr(cur);
    else if (b.type === "table") table(cur, b.header, b.rows);
  }

  footer(doc, titolo);
}
