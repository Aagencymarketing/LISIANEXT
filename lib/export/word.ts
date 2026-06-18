"use client";

import { parseBlocks, slugFile, type Run } from "./markdown";

/** Genera e scarica un file .docx (Word) dal testo markdown. */
export async function scaricaWord(titolo: string, markdown: string) {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
  } = docx;

  const runs = (rs: Run[]) =>
    rs.map((r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic }));

  const HEAD = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

  // Titolo della domanda/oggetto in cima al documento (per intero).
  if (titolo && titolo.trim()) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
        children: [new TextRun({ text: titolo.trim(), bold: true, size: 26 })],
      }),
    );
  }

  for (const b of parseBlocks(markdown)) {
    if (b.type === "h") {
      children.push(
        new Paragraph({ heading: HEAD[b.level - 1], spacing: { before: 200, after: 80 }, children: runs(b.runs) }),
      );
    } else if (b.type === "p") {
      children.push(new Paragraph({ spacing: { after: 120 }, children: runs(b.runs) }));
    } else if (b.type === "ul") {
      for (const it of b.items)
        children.push(new Paragraph({ bullet: { level: 0 }, children: runs(it) }));
    } else if (b.type === "ol") {
      b.items.forEach((it, idx) =>
        children.push(new Paragraph({ children: runs([{ text: `${idx + 1}. ` }, ...it]) })),
      );
    } else if (b.type === "hr") {
      children.push(
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } }, children: [] }),
      );
    } else if (b.type === "table") {
      const cell = (rs: Run[], header: boolean) =>
        new TableCell({
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: rs.map((r) => new TextRun({ text: r.text, bold: header || r.bold, italics: r.italic })) })],
        });
      const rows = [
        new TableRow({ tableHeader: true, children: b.header.map((c) => cell(c, true)) }),
        ...b.rows.map((r) => new TableRow({ children: r.map((c) => cell(c, false)) })),
      ];
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
      children.push(new Paragraph({ children: [] }));
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  scaricaBlob(blob, `${slugFile(titolo)}.docx`);
}

function scaricaBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
