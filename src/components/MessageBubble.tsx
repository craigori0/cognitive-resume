"use client";

import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-5 py-4 rounded-2xl bg-[rgba(31,27,22,0.06)] text-[16px] leading-[1.6] text-[#1f1b16]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] text-[16px] leading-[1.6] text-[#1f1b16]">
      <div
        className={`message-prose ${isStreaming ? "streaming-cursor" : ""}`}
      >
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
