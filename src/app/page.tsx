"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import SuggestedPrompts from "@/components/SuggestedPrompts";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import ThinkingIndicator from "@/components/ThinkingIndicator";
import FollowUpPills from "@/components/FollowUpPills";
import GrassOverlay from "@/components/GrassOverlay";
import { MailIcon } from "@/components/Icons";
import { parseSSEStream } from "@/lib/sse";
import { CURATED_FOLLOWUPS } from "@/lib/constants";
import type { Message, ProjectRow } from "@/lib/types";

const GRASS_PILL = "Enough AI talk, let\u2019s touch grass.";
const GRASS_TURN_THRESHOLD = 3; // show after this many user messages

// Recovery pills shown when the model has no useful answer (dead-end).
// Lets the user reset to a known-good entry point instead of staring at
// an empty input.
const RECOVERY_PILLS = [
  "What is this?",
  "What can I ask you about?",
  "Tell me about yourself",
];

function getCuratedFollowups(query: string): string[] | null {
  const normalized = query.toLowerCase().replace(/\?/g, "").trim();
  for (const [triggers, followups] of CURATED_FOLLOWUPS) {
    if (triggers.some((t) => normalized === t || normalized.includes(t))) {
      return followups;
    }
  }
  return null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [grassMode, setGrassMode] = useState(false);
  const [grassUsed, setGrassUsed] = useState(false);
  // One-per-session: the portfolio CTA card renders below the first answer
  // that carries a <portfolio_pointer /> tag (Q9 frog, Q10 most-proud).
  // Subsequent matches strip the tag silently to avoid repetition.
  const [portfolioPointerShown, setPortfolioPointerShown] = useState(false);
  const revealRafRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll only when the user sends a new message (called explicitly from
  // sendMessage after the user bubble is added). We deliberately do NOT
  // auto-scroll on every messages/isThinking change — that pinned the view
  // to the bottom during streaming and prevented the user from reading at
  // their own pace. Once the conversation is moving, the view stays put;
  // the floating ↓ button lets the user jump to the latest content when
  // they're ready.
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleReset = () => {
      cancelAnimationFrame(revealRafRef.current);
      setMessages([]);
      setIsThinking(false);
      setIsStreaming(false);
      setFollowups([]);
      setGrassMode(false);
      setGrassUsed(false);
      setPortfolioPointerShown(false);
    };
    window.addEventListener("chat:reset", handleReset);
    return () => window.removeEventListener("chat:reset", handleReset);
  }, []);

  const sendMessage = async (text: string) => {
    // Guard: ignore re-entrant sends (e.g. inline ask: links clicked while
    // a previous response is still streaming).
    if (isStreaming) return;

    // Intercept the grass pill — open overlay instead of sending a message
    if (text === GRASS_PILL) {
      setGrassMode(true);
      setGrassUsed(true);
      setFollowups([]);
      return;
    }

    // Pills are shown on the first turn (cold start) and on dead-end
    // recoveries. From the second turn onward we ask the model to use the
    // inline pointer format instead. userTurnCount counts the message we're
    // about to send.
    const userTurnCountForRequest = messages.filter((m) => m.role === "user")
      .length + 1;
    const suppressPills = userTurnCountForRequest > 1;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setIsThinking(true);
    setFollowups([]);
    // One-shot scroll so the user sees their question and the thinking
    // indicator. The view then stays put through streaming.
    requestAnimationFrame(() => scrollToBottom());

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, suppressPills }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      // Phase 1: Buffer the full response behind the thinking indicator.
      let fullText = "";
      for await (const chunk of parseSSEStream(response)) {
        fullText += chunk;
      }

      // Strip <followups> tag from visible text regardless.
      const followupsMatch = fullText.match(
        /<followups>\s*(\[[\s\S]*?\])\s*<\/followups>/
      );
      if (followupsMatch) {
        fullText = fullText.replace(followupsMatch[0], "").trimEnd();
      }

      // Strip <project_table> tag from visible text; parse the JSON so
      // MessageBubble can render an interactive table below the prose.
      // Payload shape is either { rows, defaultView } (current) or a bare
      // ProjectRow[] (legacy) — we accept both for backwards compatibility
      // during rollouts.
      let projectRows: ProjectRow[] | undefined;
      let projectTableDefaultView: "all" | "top" | undefined;
      const tableMatch = fullText.match(
        /<project_table>\s*([\s\S]*?)\s*<\/project_table>/
      );
      if (tableMatch) {
        fullText = fullText.replace(tableMatch[0], "").trimEnd();
        try {
          const parsed = JSON.parse(tableMatch[1]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            projectRows = parsed as ProjectRow[];
          } else if (
            parsed &&
            Array.isArray(parsed.rows) &&
            parsed.rows.length > 0
          ) {
            projectRows = parsed.rows as ProjectRow[];
            if (parsed.defaultView === "all" || parsed.defaultView === "top") {
              projectTableDefaultView = parsed.defaultView;
            }
          }
        } catch {
          // Malformed payload — silently fall back to prose only.
        }
      }

      // Strip <portfolio_pointer /> marker. We render the CTA card at
      // most once per session — subsequent matches drop the tag silently
      // to avoid repetition (e.g., user asks Q9 then Q10).
      let showPortfolioPointer = false;
      const pointerMatch = fullText.match(/<portfolio_pointer\s*\/?>/);
      if (pointerMatch) {
        fullText = fullText.replace(pointerMatch[0], "").trimEnd();
        if (!portfolioPointerShown) {
          showPortfolioPointer = true;
          setPortfolioPointerShown(true);
        }
      }

      // Decide which pills (if any) to show below this answer.
      //   - Turn 1 → full pill row (curated openers or the model's <followups>).
      //   - Turn 2+ → no pills, except a dead-end "recovery" set when the
      //     model produced no useful content. The model is using the inline
      //     pointer format instead.
      //   - Grass pill is layered on top whenever its threshold is met,
      //     even if no other pills are present.
      const isDeadEnd = !fullText.trim() && !projectRows;
      const userTurnCount = userTurnCountForRequest;

      let newFollowups: string[] = [];
      if (!suppressPills) {
        const curated = getCuratedFollowups(text);
        if (curated) {
          newFollowups = curated;
        } else if (followupsMatch) {
          try {
            const parsed = JSON.parse(followupsMatch[1]);
            if (Array.isArray(parsed)) newFollowups = parsed;
          } catch {
            // Malformed JSON — skip
          }
        }
      } else if (isDeadEnd) {
        newFollowups = [...RECOVERY_PILLS];
      }

      // Grass pill — appears standalone once the threshold is met.
      if (userTurnCount >= GRASS_TURN_THRESHOLD && !grassUsed) {
        newFollowups = [...newFollowups, GRASS_PILL];
      }
      setFollowups(newFollowups);

      // Phase 2: Add the message bubble and animate the text in.
      // Thinking indicator stays visible until we start revealing.
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          projectRows,
          projectTableDefaultView,
          showPortfolioPointer,
        },
      ]);
      setIsThinking(false);

      // Reveal characters at a fixed rate via requestAnimationFrame.
      // Fixed 2 chars/frame @ 60fps = ~120 chars/sec = ~10s for 1200 chars.
      // Cancel any in-flight reveal from a previous message.
      cancelAnimationFrame(revealRafRef.current);

      await new Promise<void>((resolve) => {
        let displayed = 0;
        const total = fullText.length;

        const tick = () => {
          // Fixed step: 2 chars per frame, easing to 1 in final 15%
          const progress = displayed / total;
          const step = progress > 0.85 ? 1 : 2;
          displayed = Math.min(total, displayed + step);

          setMessages((prev) => {
            const updated = [...prev];
            const prior = updated[updated.length - 1];
            updated[updated.length - 1] = {
              role: "assistant",
              content: fullText.slice(0, displayed),
              projectRows: prior?.projectRows,
              projectTableDefaultView: prior?.projectTableDefaultView,
              showPortfolioPointer: prior?.showPortfolioPointer,
            };
            return updated;
          });

          if (displayed >= total) {
            resolve();
          } else {
            revealRafRef.current = requestAnimationFrame(tick);
          }
        };
        revealRafRef.current = requestAnimationFrame(tick);
      });

      if (!fullText.trim() && !projectRows) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              "I wasn't able to find relevant information for that question. Try asking about Craig's projects, skills, or career — or reach out directly at craig@ciserodesign.co.",
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsThinking(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const errorContent =
          "Sorry, something went wrong. Please try again, or reach out to Craig directly at craig@ciserodesign.co.";
        if (last?.role === "assistant") {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: errorContent,
          };
          return updated;
        }
        return [...prev, { role: "assistant", content: errorContent }];
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const hasConversation = messages.length > 0 || isThinking;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Gradient halo — covers first viewport, scrolls away with content */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-screen z-0 pointer-events-none"
        style={{
          backgroundImage: [
            `radial-gradient(45% 40% at 50% 22%, rgba(245,222,188,0.55) 0%, rgba(245,222,188,0.40) 35%, rgba(235,210,175,0.18) 60%, rgba(0,0,0,0) 80%)`,
            `radial-gradient(70% 60% at 50% 30%, rgba(248,230,200,0.40) 0%, rgba(245,225,195,0.25) 35%, rgba(235,215,180,0.10) 60%, rgba(0,0,0,0) 80%)`,
          ].join(", "),
        }}
      />
      <Header />

      {hasConversation ? (
        <ConversationLayout
          messages={messages}
          isThinking={isThinking}
          isStreaming={isStreaming}
          followups={followups}
          chatEndRef={chatEndRef}
          onSend={sendMessage}
        />
      ) : (
        <LandingLayout onSend={sendMessage} />
      )}

      {grassMode && (
        <GrassOverlay
          onClose={() => setGrassMode(false)}
          mainHistory={messages}
        />
      )}
    </div>
  );
}

function LandingLayout({ onSend }: { onSend: (text: string) => void }) {
  return (
    <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-12">
      <div className="flex flex-col items-center text-center max-w-[645px] w-full">
        <h1 className="hero-rise hero-rise-1 font-display font-thin text-[52px] leading-[1.15] tracking-[-1.04px] text-[#1f1b16]">
          Hi, I&apos;m Craig Cisero
        </h1>
        <p className="hero-rise hero-rise-2 mt-5 font-light text-[18px] leading-[1.6] text-[rgba(31,27,22,0.5)]">
          Strategic builder at frog design focused on cognitive systems. Ask me anything about my work.
        </p>

        <div className="mt-12 w-full flex flex-col items-center gap-6">
          <div className="hero-rise hero-rise-3 w-full flex justify-center">
            <SuggestedPrompts onSelect={onSend} />
          </div>
          <div className="hero-rise hero-rise-4 w-full flex justify-center">
            <ChatInput onSend={onSend} />
          </div>
        </div>

        <p className="hero-rise hero-rise-4 mt-4 max-w-[384px] text-[12px] leading-[18px] text-[rgba(31,27,22,0.3)] inline-flex items-center justify-center gap-1.5 flex-wrap">
          <span>Responses are generated based on reasoning over Craig&apos;s authored
          knowledge base. Reach out directly for a real conversation.</span>
          <a
            href="mailto:craig@ciserodesign.co"
            aria-label="Email Craig"
            className="inline-flex items-center text-[rgba(31,27,22,0.35)] hover:text-[rgba(31,27,22,0.6)] transition-colors"
          >
            <MailIcon className="w-3.5 h-3.5" />
          </a>
        </p>
      </div>
    </main>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ConversationLayout({
  messages,
  isThinking,
  isStreaming,
  followups,
  chatEndRef,
  onSend,
}: {
  messages: Message[];
  isThinking: boolean;
  isStreaming: boolean;
  followups: string[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onSend: (text: string) => void;
}) {
  const showFollowups = followups.length > 0 && !isStreaming && !isThinking;

  // Floating ↓ button: appears when the user is scrolled away from the
  // bottom of the transcript. Lets them jump to the latest content
  // without auto-scrolling them while they're still reading.
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const recomputeScrollState = useCallback(() => {
    const el = transcriptRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    // 80px threshold so tiny rounding differences don't flicker the button
    setShowScrollDown(distance > 80);
  }, []);

  // Scroll listener
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.addEventListener("scroll", recomputeScrollState, { passive: true });
    return () => el.removeEventListener("scroll", recomputeScrollState);
  }, [recomputeScrollState]);

  // Recompute when content grows (streaming, new messages, thinking
  // indicator) — the listener only fires on actual scroll events, not
  // on container size changes.
  useEffect(() => {
    recomputeScrollState();
  }, [messages, isThinking, recomputeScrollState]);

  const handleScrollDown = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative z-10 flex-1 flex flex-col pt-28">
      {/* Scrollable transcript */}
      <div ref={transcriptRef} className="flex-1 overflow-y-auto chat-scroll">
        <div className="max-w-[680px] mx-auto px-6 pb-8 flex flex-col gap-6">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              projectRows={msg.projectRows}
              projectTableDefaultView={msg.projectTableDefaultView}
              showPortfolioPointer={msg.showPortfolioPointer}
              isStreaming={
                isStreaming &&
                i === messages.length - 1 &&
                msg.role === "assistant"
              }
            />
          ))}
          {isThinking && <ThinkingIndicator />}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Docked input */}
      <div className="shrink-0 px-6 pb-4 pt-2 flex flex-col items-center relative">
        {/* Floating "scroll to latest" button — sits just above the dock,
            visible only when the user has scrolled away from the bottom. */}
        {showScrollDown && (
          <button
            type="button"
            onClick={handleScrollDown}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 border border-[rgba(31,27,22,0.1)] shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur-sm text-[rgba(31,27,22,0.55)] hover:text-[#1f1b16] hover:bg-white transition-colors cursor-pointer"
            aria-label="Scroll to latest message"
          >
            <ChevronDownIcon />
          </button>
        )}
        <div className="w-full max-w-[680px]">
          {showFollowups && (
            <FollowUpPills prompts={followups} onSelect={onSend} />
          )}
          <ChatInput onSend={onSend} disabled={isStreaming} />
        </div>
        <p className="mt-3 max-w-[420px] text-[12px] leading-[18px] text-center text-[rgba(31,27,22,0.3)]">
          Responses are generated based on reasoning over Craig&apos;s authored
          knowledge base.{" "}
          <a
            href="mailto:craig@ciserodesign.co"
            className="text-[rgba(31,27,22,0.55)] underline decoration-dotted underline-offset-2 hover:text-[rgba(31,27,22,0.8)] transition-colors"
          >
            Reach out directly
          </a>{" "}
          for a real conversation.
        </p>
      </div>
    </main>
  );
}
