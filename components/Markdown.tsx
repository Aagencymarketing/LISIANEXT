import { Fragment, type ReactNode } from "react";

/** Render inline: **bold**, _italic_, `code`. Input già "sicuro" (testo nostro). */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("_")) out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    else
      out.push(
        <code
          key={key}
          className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[0.85em]"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const ORDERED = /^\s*\d+\.\s+/;
const BULLET = /^\s*[-*]\s+/;
const isTableSep = (s: string) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(s) && s.includes("-");
const hasPipe = (s: string) => s.includes("|");

/** Divide una riga di tabella in celle, ignorando i pipe ai bordi. */
function cells(row: string): string[] {
  let s = row.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

export function Markdown({ children }: { children: string }) {
  const lines = children.split("\n");
  const blocks: ReactNode[] = [];
  let k = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trimEnd();

    // --- Tabella GFM: riga con pipe seguita da riga separatore ---
    if (hasPipe(line) && idx + 1 < lines.length && isTableSep(lines[idx + 1])) {
      const header = cells(line);
      const rows: string[][] = [];
      idx += 2; // salta header + separatore
      while (idx < lines.length && hasPipe(lines[idx]) && lines[idx].trim() !== "") {
        rows.push(cells(lines[idx]));
        idx++;
      }
      idx--; // compensa l'incremento del for
      blocks.push(
        <div key={`tbl-${k++}`} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {header.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold align-top">
                    {inline(h, `th-${k}-${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-border/60">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 align-top">
                      {inline(c, `td-${k}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // --- Lista puntata ---
    if (BULLET.test(line)) {
      const items: string[] = [];
      while (idx < lines.length && BULLET.test(lines[idx])) {
        items.push(lines[idx].replace(BULLET, "").trimEnd());
        idx++;
      }
      idx--;
      blocks.push(
        <ul key={`ul-${k++}`} className="my-2 ml-5 list-disc space-y-1">
          {items.map((it, i) => (
            <li key={i}>{inline(it, `li-${k}-${i}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // --- Lista numerata ---
    if (ORDERED.test(line)) {
      const items: string[] = [];
      while (idx < lines.length && ORDERED.test(lines[idx])) {
        items.push(lines[idx].replace(ORDERED, "").trimEnd());
        idx++;
      }
      idx--;
      blocks.push(
        <ol key={`ol-${k++}`} className="my-2 ml-5 list-decimal space-y-1">
          {items.map((it, i) => (
            <li key={i} className="pl-1">{inline(it, `ol-${k}-${i}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.trim() === "") continue;

    // --- Heading ---
    if (line.startsWith("#### ")) {
      blocks.push(
        <h4 key={`h-${k++}`} className="mt-3 mb-1 text-sm font-semibold">
          {inline(line.slice(5), `h4-${k}`)}
        </h4>,
      );
    } else if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h-${k++}`} className="mt-3.5 mb-1 text-base font-bold">
          {inline(line.slice(4), `h3-${k}`)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h-${k++}`} className="mt-4 mb-1.5 text-lg font-bold">
          {inline(line.slice(3), `h2-${k}`)}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={`h-${k++}`} className="mt-4 mb-2 text-xl font-bold">
          {inline(line.slice(2), `h1-${k}`)}
        </h1>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`q-${k++}`}
          className="my-3 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {inline(line.slice(2), `q-${k}`)}
        </blockquote>,
      );
    } else if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      // riga orizzontale --- *** ___
      blocks.push(<hr key={`hr-${k++}`} className="my-4 border-border" />);
    } else {
      blocks.push(
        <p key={`p-${k++}`} className="my-1.5 leading-relaxed">
          {inline(line, `p-${k}`)}
        </p>,
      );
    }
  }

  return (
    <div className="text-sm text-foreground">
      {blocks.map((b, i) => (
        <Fragment key={i}>{b}</Fragment>
      ))}
    </div>
  );
}
