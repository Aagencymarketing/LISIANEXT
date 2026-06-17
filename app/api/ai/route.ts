import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  systemPrompt,
  buildUserMessage,
  maxTokens,
  type ContestoAIPayload,
} from "@/lib/ai/prompts";
import type { ModuloAI } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODELLO = "claude-opus-4-8";

interface Body {
  modulo: ModuloAI;
  prompt: string;
  contesto?: ContestoAIPayload;
}

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
  const { modulo, prompt, contesto } = body;
  if (!prompt || !modulo) {
    return new Response("Parametri mancanti", { status: 400 });
  }

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
          system: systemPrompt(modulo),
          messages: [
            { role: "user", content: buildUserMessage(modulo, prompt, contesto) },
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
