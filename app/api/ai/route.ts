import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  systemPrompt,
  buildUserMessage,
  maxTokens,
  type ContestoAIPayload,
  type VarianteParere,
} from "@/lib/ai/prompts";
import type { ModuloAI } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODELLO = "claude-opus-4-8";

interface Turno {
  ruolo: "utente" | "assistente";
  contenuto: string;
}

interface DocumentoRef {
  path: string;
  nome: string;
  estensione?: string;
}

interface Body {
  modulo: ModuloAI;
  prompt: string;
  contesto?: ContestoAIPayload;
  storia?: Turno[];
  documenti?: DocumentoRef[];
  variante?: VarianteParere;
}

const IMG: Record<string, "image/png" | "image/jpeg" | "image/webp" | "image/gif"> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function POST(req: Request) {
  // 1) Solo utenti autenticati
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorizzato", { status: 401 });
  }

  // 2) Chiave configurata?
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("AI non configurata (manca ANTHROPIC_API_KEY).", {
      status: 503,
    });
  }

  // 3) Body
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Richiesta non valida", { status: 400 });
  }
  const { modulo, prompt, contesto, storia, documenti, variante } = body;
  if (!prompt || !modulo) {
    return new Response("Parametri mancanti", { status: 400 });
  }

  // Identità dell'avvocato dall'utente autenticato (per intestazione/firma del parere/atto).
  const avvocatoNome =
    (user.user_metadata?.nome_completo as string | undefined)?.trim() ||
    (user.email || "").split("@")[0] ||
    undefined;
  const contestoFinale: ContestoAIPayload = {
    ...(contesto ?? {}),
    avvocatoNome: contesto?.avvocatoNome || avvocatoNome,
  };

  // Storico conversazione (multi-turno). L'ultimo messaggio utente è `prompt`.
  const messaggiPrecedenti = (storia ?? [])
    .filter((m) => m.contenuto?.trim())
    .map((m) => ({
      role: m.ruolo === "assistente" ? ("assistant" as const) : ("user" as const),
      content: m.contenuto,
    }));

  // Documenti allegati: PDF e immagini letti nativamente da Claude; TXT come testo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocchiDoc: any[] = [];
  const testiDoc: string[] = [];
  const saltati: string[] = [];
  for (const d of documenti ?? []) {
    const est = (d.estensione || d.nome.split(".").pop() || "").toLowerCase();
    try {
      const { data, error } = await supabase.storage.from("documenti").download(d.path);
      if (error || !data) {
        saltati.push(d.nome);
        continue;
      }
      const buf = Buffer.from(await data.arrayBuffer());
      if (est === "pdf") {
        blocchiDoc.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") },
          title: d.nome,
        });
      } else if (IMG[est]) {
        blocchiDoc.push({
          type: "image",
          source: { type: "base64", media_type: IMG[est], data: buf.toString("base64") },
        });
      } else if (est === "txt") {
        testiDoc.push(`### Documento "${d.nome}"\n${buf.toString("utf-8").slice(0, 20000)}`);
      } else {
        saltati.push(d.nome);
      }
    } catch {
      saltati.push(d.nome);
    }
  }

  let testoUtente = buildUserMessage(modulo, prompt, contestoFinale);
  if (testiDoc.length) testoUtente += `\n\nContenuto dei documenti testuali allegati:\n${testiDoc.join("\n\n")}`;
  if (saltati.length)
    testoUtente += `\n\n(Nota: i seguenti allegati non sono in un formato leggibile e non sono stati analizzati: ${saltati.join(", ")}.)`;

  const contenutoUtente = blocchiDoc.length
    ? [...blocchiDoc, { type: "text", text: testoUtente }]
    : testoUtente;

  // 4) Streaming da Claude
  const anthropic = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const aiStream = anthropic.messages.stream({
          model: MODELLO,
          max_tokens: maxTokens(modulo),
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          system: systemPrompt(modulo, variante),
          messages: [
            ...messaggiPrecedenti,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { role: "user", content: contenutoUtente as any },
          ],
        });

        for await (const event of aiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (e) {
        console.error("[api/ai]", e);
        controller.enqueue(
          encoder.encode("\n\n> ⚠️ Si è verificato un errore con l'AI. Riprova."),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
