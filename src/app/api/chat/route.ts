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
      suppressPills = false,
    }: {
      message: string;
      history: Message[];
      grassMode?: boolean;
      suppressPills?: boolean;
    } = await req.json();

    if (!message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Retrieve relevant context
    const retrieval = await retrieve(message);

    // Breadth-table mode: the client will render an interactive project
    // table from structured JSON. Tell Claude to write only short prose
    // (intro + takeaway) and NOT to emit a markdown table of its own.
    const hasBreadthTable =
      !grassMode && retrieval.breadthProjects.length > 0;

    const breadthPreview = hasBreadthTable
      ? retrieval.breadthProjects
          .slice(0, 10)
          .map(
            (p) =>
              `- ${p.client} (${p.year}) — ${p.industry} — ${p.projectType} — ${p.tier || "Context"}`
          )
          .join("\n")
      : "";

    const breadthInstruction = hasBreadthTable
      ? `

IMPORTANT — TABLE RENDERING:
The client UI will render an interactive, filterable, tier-sorted project table directly from the ${retrieval.breadthProjects.length} rows below. Do NOT write a markdown table. Do NOT list the projects row-by-row.
Your job is to write ONLY:
1. A 1-2 sentence first-person intro framing what the user is about to see (e.g. "Here's the full view of my healthcare work — hospital systems, pharma, insurance, and imaging.").
2. A 1-2 sentence closing takeaway highlighting a pattern, a hero case, or what to dig into next.
Keep the total response under 80 words. Do not emit any pipe characters ("|") or markdown table syntax.

Preview of the rows the UI will render (pre-sorted Hero → Detail → Context, newest first):
${breadthPreview}${retrieval.breadthProjects.length > 10 ? `\n…and ${retrieval.breadthProjects.length - 10} more.` : ""}`
      : "";

    // Breadth-offer mode: depth query that touches a focus area with enough
    // matching rows to be worth surfacing as a table. Ask Claude to close
    // with a one-sentence nudge and include a specific <item> in <followups>
    // so the UI can render a "See all my X work" pill. Clicking that pill
    // sends a query that definitively matches BREADTH_PATTERNS and triggers
    // the full table on the next turn. Disabled when pills are suppressed —
    // the inline pointer format covers the same affordance.
    const hasBreadthOffer =
      !grassMode &&
      !hasBreadthTable &&
      !suppressPills &&
      !!retrieval.breadthOffer;
    const breadthOfferInstruction = hasBreadthOffer
      ? `

BREADTH OFFER:
I have ${retrieval.breadthOffer!.count} total projects in ${retrieval.breadthOffer!.label}. You're writing a depth answer here — stay focused on the marquee work the retrieved context highlights. But because more exists than what you're showing, do two things:
1. BEFORE the <followups> tag, end your answer with a gentle one-sentence nudge inviting the user to see the full picture. Phrase it naturally in first person, e.g. "There's more ${retrieval.breadthOffer!.label} work across the portfolio if you want the full view." Vary the phrasing — don't always say "full view."
2. Inside your <followups> tag, make sure ONE of the <item> entries is EXACTLY this string (do not paraphrase, do not add quotes):
<item>See all my ${retrieval.breadthOffer!.label} work</item>
Keep your other 1-2 follow-ups contextual to the specific answer you just gave.`
      : "";

    // Follow-up mode instruction. The UI shows pill prompts only on the
    // first turn and on dead-end recoveries; otherwise it hides them and
    // lets the user type whatever they want. When suppressed, we tell
    // Claude to omit the <followups> tag. Plain-prose suggestions about
    // adjacent threads are still welcome — they just can't be clickable
    // links or special markdown formats. The user types if interested.
    const followupModeInstruction = grassMode
      ? "" // Grass mode keeps its own followup contract (see GRASS_MODE_PROMPT).
      : suppressPills
        ? `\n\nFOLLOW-UP MODE: skip the <followups> tag on this response. The UI is hiding follow-up pills for this turn. If a genuinely high-value adjacent thread exists, you may mention it naturally in your prose — a single short sentence like "There's a deeper story on the Hoag work if you want it" or "I can walk you through Deliveroo too." Plain prose only: NO markdown links, NO clickable buttons, NO ask:-style URLs. Only mention an adjacent thread when it adds real value; if the answer is complete, just stop.`
        : "";

    // Build the user message with context
    const userMessage = `The user asked: "${message}"

Here is the relevant context retrieved from Craig's knowledge base:

<retrieved_context>
${retrieval.contextText}
</retrieved_context>

Respond to the user's question using the retrieved context. Follow the system prompt guidelines for voice, reasoning, and guardrails. If a curated response is included, use it as the primary basis for your answer while making it feel natural and conversational.${breadthInstruction}${breadthOfferInstruction}${followupModeInstruction}`;

    // Build conversation messages — keep clean user messages in history
    const messages: Message[] = [
      ...history.slice(-16), // Last 8 turns
      { role: "user", content: userMessage },
    ];

    // Stream response from Claude. max_tokens is bumped so that breadth /
    // table answers (e.g. "all my healthcare projects") don't get truncated
    // mid-row. Grass mode stays modest since answers are 50-150 words.
    const maxTokens = grassMode ? 500 : 1500;
    const stream = await getAnthropic().messages.stream({
      model: "claude-opus-4-6",
      max_tokens: maxTokens,
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

          // After Claude's prose, append the structured project table
          // payload if this was a breadth query. The client pulls the
          // JSON out of the buffered text and renders a <ProjectTable />.
          // Payload shape: { rows, defaultView } — defaultView tells the
          // UI whether to open on "Top Projects" or "All Projects" based
          // on how the user phrased their query.
          if (hasBreadthTable) {
            const tablePayload = {
              rows: retrieval.breadthProjects,
              defaultView: retrieval.breadthDefaultView,
            };
            const tableBlock = `\n\n<project_table>${JSON.stringify(
              tablePayload
            )}</project_table>`;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: tableBlock })}\n\n`)
            );
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
