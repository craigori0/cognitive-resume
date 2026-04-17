"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUpIcon } from "./Icons";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasValue = value.trim().length > 0;

  return (
    <div
      className="flex items-end gap-1 w-full pl-5 pr-2.5 py-2.5 rounded-2xl bg-white/80 border border-[rgba(31,27,22,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-sm focus-within:border-[rgba(31,27,22,0.2)] transition-colors"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent outline-none text-[16px] leading-6 text-[#1f1b16] placeholder:text-[rgba(31,27,22,0.3)] py-2.5 max-h-40"
      />
      <button
        onClick={handleSubmit}
        disabled={!hasValue || disabled}
        aria-label="Send message"
        className={`shrink-0 mb-1.5 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
          hasValue && !disabled
            ? "bg-[#1f1b16] text-[#faf7f2] hover:bg-[#2e2920]"
            : "bg-[#1f1b16]/20 text-[#faf7f2]"
        }`}
      >
        <ArrowUpIcon />
      </button>
    </div>
  );
}
