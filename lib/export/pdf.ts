"use client";

import { parseBlocks, slugFile, type Run } from "./markdown";
import { renderPdf } from "./pdfRender";

/**
 * Scarica un PDF "pulito" (testo selezionabile, niente artefatti di stampa del
 * browser come "about:blank" o data/ora). Genera il file con jsPDF; se per
 * qualunque motivo fallisse, ripiega sulla stampa-browser.
 */
export async function scaricaPDF(titolo: string, markdown: string) {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    renderPdf(doc, titolo, markdown);
    doc.save(`${slugFile(titolo)}.pdf`);
  } catch (e) {
    console.error("[pdf] generazione fallita, ripiego sulla stampa", e);
    stampaPDF(titolo, markdown);
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function runsHtml(rs: Run[]): string {
  return rs
    .map((r) => {
      let t = esc(r.text);
      if (r.bold) t = `<strong>${t}</strong>`;
      if (r.italic) t = `<em>${t}</em>`;
      return t;
    })
    .join("");
}

function blocksHtml(markdown: string): string {
  const out: string[] = [];
  for (const b of parseBlocks(markdown)) {
    if (b.type === "h") out.push(`<h${b.level}>${runsHtml(b.runs)}</h${b.level}>`);
    else if (b.type === "p") out.push(`<p>${runsHtml(b.runs)}</p>`);
    else if (b.type === "ul") out.push(`<ul>${b.items.map((it) => `<li>${runsHtml(it)}</li>`).join("")}</ul>`);
    else if (b.type === "ol") out.push(`<ol>${b.items.map((it) => `<li>${runsHtml(it)}</li>`).join("")}</ol>`);
    else if (b.type === "hr") out.push("<hr/>");
    else if (b.type === "table") {
      const head = `<tr>${b.header.map((c) => `<th>${runsHtml(c)}</th>`).join("")}</tr>`;
      const body = b.rows.map((r) => `<tr>${r.map((c) => `<td>${runsHtml(c)}</td>`).join("")}</tr>`).join("");
      out.push(`<table><thead>${head}</thead><tbody>${body}</tbody></table>`);
    }
  }
  return out.join("\n");
}

/**
 * Apre una finestra di stampa con il documento impaginato (A4, testo selezionabile):
 * l'utente sceglie "Salva come PDF". Affidabile e senza dipendenze.
 */
export function stampaPDF(titolo: string, markdown: string) {
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
<title>${esc(titolo)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; font-size: 12pt; line-height: 1.5; color: #111; }
  .doc-title { font-size: 15pt; font-weight: bold; margin: 0 0 14pt; padding-bottom: 8pt; border-bottom: 1px solid #ccc; }
  h1 { font-size: 16pt; margin: 14pt 0 6pt; }
  h2 { font-size: 13.5pt; margin: 14pt 0 5pt; }
  h3 { font-size: 12pt; margin: 11pt 0 4pt; }
  h4 { font-size: 11.5pt; margin: 9pt 0 3pt; }
  p { margin: 5pt 0; text-align: justify; }
  ul, ol { margin: 5pt 0 5pt 18pt; }
  li { margin: 2pt 0; }
  hr { border: none; border-top: 1px solid #bbb; margin: 12pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 11pt; }
  th, td { border: 1px solid #999; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head>
<body>${titolo && titolo.trim() ? `<div class="doc-title">${esc(titolo.trim())}</div>` : ""}${blocksHtml(markdown)}</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    alert("Abilita i pop-up per scaricare il PDF.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // attende il render, poi apre la stampa
  w.onload = () => {
    w.focus();
    w.print();
  };
  // fallback se onload non scatta
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {}
  }, 500);
}
