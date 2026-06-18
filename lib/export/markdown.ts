// Parser markdown minimale CONDIVISO dagli exporter (Word/PDF).
// Allineato a components/Markdown.tsx: titoli #..####, **bold**, _italic_,
// liste puntate/numerate, tabelle GFM, riga orizzontale.

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type Block =
  | { type: "h"; level: 1 | 2 | 3 | 4; runs: Run[] }
  | { type: "p"; runs: Run[] }
  | { type: "ul"; items: Run[][] }
  | { type: "ol"; items: Run[][] }
  | { type: "table"; header: Run[][]; rows: Run[][][] }
  | { type: "hr" };

const ORDERED = /^\s*\d+\.\s+/;
const BULLET = /^\s*[-*]\s+/;
const isTableSep = (s: string) =>
  /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(s) && s.includes("-");
const hasPipe = (s: string) => s.includes("|");

/** Spezza il testo inline in run con grassetto/corsivo. */
export function parseInline(text: string): Run[] {
  const out: Run[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**")) out.push({ text: tok.slice(2, -2), bold: true });
    else if (tok.startsWith("_")) out.push({ text: tok.slice(1, -1), italic: true });
    else out.push({ text: tok.slice(1, -1) });
    last = m.index + tok.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out.length ? out : [{ text: "" }];
}

function cells(row: string): string[] {
  let s = row.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

export function parseBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Tabella
    if (hasPipe(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = cells(line).map(parseInline);
      const rows: Run[][][] = [];
      i += 2;
      while (i < lines.length && hasPipe(lines[i]) && lines[i].trim() !== "") {
        rows.push(cells(lines[i]).map(parseInline));
        i++;
      }
      i--;
      blocks.push({ type: "table", header, rows });
      continue;
    }

    // Lista puntata
    if (BULLET.test(line)) {
      const items: Run[][] = [];
      while (i < lines.length && BULLET.test(lines[i])) {
        items.push(parseInline(lines[i].replace(BULLET, "").trimEnd()));
        i++;
      }
      i--;
      blocks.push({ type: "ul", items });
      continue;
    }

    // Lista numerata
    if (ORDERED.test(line)) {
      const items: Run[][] = [];
      while (i < lines.length && ORDERED.test(lines[i])) {
        items.push(parseInline(lines[i].replace(ORDERED, "").trimEnd()));
        i++;
      }
      i--;
      blocks.push({ type: "ol", items });
      continue;
    }

    if (line.trim() === "") continue;

    if (line.startsWith("#### ")) blocks.push({ type: "h", level: 4, runs: parseInline(line.slice(5)) });
    else if (line.startsWith("### ")) blocks.push({ type: "h", level: 3, runs: parseInline(line.slice(4)) });
    else if (line.startsWith("## ")) blocks.push({ type: "h", level: 2, runs: parseInline(line.slice(3)) });
    else if (line.startsWith("# ")) blocks.push({ type: "h", level: 1, runs: parseInline(line.slice(2)) });
    else if (line.startsWith("> ")) blocks.push({ type: "p", runs: parseInline(line.slice(2)) });
    else if (/^\s*([-*_])\1{2,}\s*$/.test(line)) blocks.push({ type: "hr" });
    else blocks.push({ type: "p", runs: parseInline(line) });
  }

  return blocks;
}

/** Nome file "sicuro" da un titolo. */
export function slugFile(titolo: string): string {
  return (
    (titolo || "documento")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "documento"
  );
}
