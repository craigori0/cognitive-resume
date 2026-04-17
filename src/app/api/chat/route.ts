import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { retrieve } from "@/lib/retrieve";
import { SYSTEM_PROMPT, GRASS_MODE_PROMPT } from "@/lib/constants";
import type { Message } from "@/lib/types";

// Lazy-init — use CLAUDE_API_KEY with ANTHROPIC_API_KEY as fallback.
// ANTHROPIC_API_KEY can be overridden to empty by the shell (e.g. Claude Code),
// so we provide an alias that won't conflict.
let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      history = [],
      grassMode = false,
    }: { message: string; history: Message[]; grassMode?: boolean } =
      await req.json();

    if (!message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Retrieve relevant context
    const retrieval = await retrieve(message);

    // Build the user message with context
    const userMessage = `The user asked: "${message}"

Here is the relevant context retrieved from Craig's knowledge base:

<retrieved_context>
${retrieval.contextText}
</retrieved_context>

Respond to the user's question using the retrieved context. Follow the system prompt guidelines for voice, reasoning, and guardrails. If a curated response is included, use it as the primary basis for your answer while making it feel natural and conversational.`;

    // Build conversation messages — keep clean user messages in history
    const messages: Message[] = [
      ...history.slice(-16), // Last 8 turns
      { role: "user", content: userMessage },
    ];

    // Stream response from Claude
    const stream = await getAnthropic().messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 600,
      system: grassMode
        ? `${SYSTEM_PROMPT}\n\n${GRASS_MODE_PROMPT}`
        : SYSTEM_PROMPT,
      messages,
    });

    // Return as a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
