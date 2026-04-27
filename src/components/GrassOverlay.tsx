"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpIcon } from "./Icons";
import { parseSSEStream } from "@/lib/sse";
import type { Message } from "@/lib/types";

const GRASS_PROMPTS = [
  "What kind of music are you into?",
  "Do you like to travel?",
  "What do you do for fun?",
];

interface GrassOverlayProps {
  onClose: () => void;
  /** Main chat history passed through for API context continuity */
  mainHistory: Message[];
}

export default function GrassOverlay({ onClose, mainHistory }: GrassOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "*takes a deep breath* — Much better out here. Ask me something that's not on a resume.",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [followups, setFollowups] = useState<string[]>(GRASS_PROMPTS);
  const [inputValue, setInputValue] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const revealRafRef = useRef<number>(0);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [inputValue]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 350); // wait for fade-out
  };

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setIsThinking(true);
    setFollowups([]);
    setInputValue("");

    try {
      // Include main chat history for context continuity. CRITICAL: strip
      // both mainHistory and grassHistory down to {role, content} only —
      // Message has optional fields (projectRows, projectTableDefaultView,
      // showPortfolioPointer) that the Anthropic SDK rejects when forwarded
      // to its messages.stream() call. Without this, every grass-mode turn
      // after the main chat has had any assistant turn fails silently into
      // the catch block.
      const cleanHistory = (msgs: Message[]) =>
        msgs
          .filter((m) => m.content)
          .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: [...cleanHistory(mainHistory).slice(-8), ...cleanHistory(messages)],
          grassMode: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      let fullText = "";
      for await (const chunk of parseSSEStream(response)) {
        fullText += chunk;
      }

      // Strip followups tag
      const followupsMatch = fullText.match(
        /<followups>\s*(\[[\s\S]*?\])\s*<\/followups>/
      );
      if (followupsMatch) {
        fullText = fullText.replace(followupsMatch[0], "").trimEnd();
      }

      // Parse followups
      if (followupsMatch) {
        try {
          const parsed = JSON.parse(followupsMatch[1]);
          if (Array.isArray(parsed)) setFollowups(parsed);
        } catch {
          setFollowups(GRASS_PROMPTS.slice(0, 3));
        }
      } else {
        setFollowups(GRASS_PROMPTS.slice(0, 3));
      }

      // Reveal animation
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsThinking(false);

      cancelAnimationFrame(revealRafRef.current);

      await new Promise<void>((resolve) => {
        let displayed = 0;
        const total = fullText.length;

        const tick = () => {
          const progress = displayed / total;
          const step = progress > 0.85 ? 1 : 2;
          displayed = Math.min(total, displayed + step);

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: fullText.slice(0, displayed),
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
    } catch (error) {
      console.error("Grass chat error:", error);
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Hmm, got a little lost in the grass there. Try again?",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const showFollowups = followups.length > 0 && !isStreaming && !isThinking;
  const hasValue = inputValue.trim().length > 0;

  return (
    <div
      className={`grass-overlay ${isVisible ? "grass-overlay-visible" : ""}`}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bliss2.jpg')" }}
      />

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-colors cursor-pointer"
        aria-label="Close grass mode"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4l8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Chat area */}
      <div className="relative z-10 h-full flex flex-col pt-20">
        {/* Scrollable transcript */}
        <div className="flex-1 overflow-y-auto chat-scroll">
          <div className="max-w-[680px] mx-auto px-6 pb-8 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <GrassBubble
                key={i}
                role={msg.role}
                content={msg.content}
                isStreaming={
                  isStreaming &&
                  i === messages.length - 1 &&
                  msg.role === "assistant"
                }
              />
            ))}
            {isThinking && <GrassThinking />}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Docked input */}
        <div className="shrink-0 px-6 pb-6 pt-2 flex flex-col items-center">
          <div className="w-full max-w-[680px]">
            {showFollowups && (
              <div className="flex flex-wrap justify-start gap-2 mb-2 animate-fadeIn">
                {followups.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-1.5 rounded-full text-[12px] leading-[1.4] font-light text-white/80 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 rounded-full text-[12px] leading-[1.4] font-light text-white/50 bg-transparent border border-dashed border-white/20 hover:border-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  Back to business
                </button>
              </div>
            )}

            {/* Glass input */}
            <div className="flex items-end gap-1 w-full pl-5 pr-2.5 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-[0_2px_20px_rgba(0,0,0,0.15)] focus-within:border-white/40 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something human..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-[16px] leading-6 text-white placeholder:text-white/40 py-2.5 max-h-40"
              />
              <button
                onClick={handleSubmit}
                disabled={!hasValue || isStreaming}
                aria-label="Send message"
                className={`shrink-0 mb-1.5 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                  hasValue && !isStreaming
                    ? "bg-white/90 text-[#1a5c1a]"
                    : "bg-white/20 text-white/40"
                }`}
              >
                <ArrowUpIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Glass-morphic message bubble for grass mode */
function GrassBubble({
  role,
  content,
  isStreaming = false,
}: {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-5 py-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 text-[16px] leading-[1.6] text-white">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] text-[16px] leading-[1.6]">
      <div className="px-5 py-4 rounded-2xl bg-black/15 backdrop-blur-md border border-white/15">
        <div
          className={`grass-prose ${isStreaming ? "grass-streaming-cursor" : ""}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-2"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="grass-table-wrap">
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

/** Thinking indicator for grass mode */
function GrassThinking() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-black/15 backdrop-blur-md border border-white/15 w-fit">
      <div className="flex items-end gap-[3px] h-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[3px] h-full rounded-full bg-white/60 thinking-bar"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      <span className="text-[13px] text-white/60 font-light">
        Touching grass...
      </span>
    </div>
  );
}
