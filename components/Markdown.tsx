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

export function Markdown({ children }: { children: string }) {
  const lines = children.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let k = 0;

  const flushList = () => {
    if (!list.length) return;
    const items = [...list];
    blocks.push(
      <ul key={`ul-${k++}`} className="my-2 ml-5 list-disc space-y-1">
        {items.map((it, idx) => (
          <li key={idx}>{inline(it, `li-${k}-${idx}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    flushList();
    if (line.trim() === "") {
      continue;
    }
    if (line.startsWith("## ")) {
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
    } else {
      blocks.push(
        <p key={`p-${k++}`} className="my-1.5 leading-relaxed">
          {inline(line, `p-${k}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="text-sm text-foreground">{blocks.map((b, i) => (
    <Fragment key={i}>{b}</Fragment>
  ))}</div>;
}
