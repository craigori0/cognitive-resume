"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ProjectTable from "./ProjectTable";
import type { ProjectRow } from "@/lib/types";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  projectRows?: ProjectRow[];
}

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
  projectRows,
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

  const hasMarkdownTable = /(^|\n)\s*\|.+\|.*\n\s*\|?\s*[-:| ]+\|/.test(content);
  const hasStructuredTable = !!(projectRows && projectRows.length > 0);
  const wide = hasMarkdownTable || hasStructuredTable;

  return (
    <div
      className={`${wide ? "w-full" : "max-w-[600px]"} text-[16px] leading-[1.6] text-[#1f1b16]`}
    >
      <div
        className={`message-prose ${isStreaming ? "streaming-cursor" : ""}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="message-table-wrap">
                <table>{children}</table>
              </div>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {hasStructuredTable && !isStreaming && (
        <ProjectTable rows={projectRows!} />
      )}
    </div>
  );
}
