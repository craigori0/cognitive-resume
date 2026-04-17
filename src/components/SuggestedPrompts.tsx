"use client";

import { SUGGESTED_PROMPTS } from "@/lib/constants";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export default function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-3 max-w-[706px] px-4">
      {SUGGESTED_PROMPTS.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.prompt)}
          className="px-4 py-2 rounded-full bg-white/70 border border-[rgba(31,27,22,0.07)] text-[14px] leading-[21px] text-[rgba(31,27,22,0.7)] hover:bg-white hover:text-[#1f1b16] transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
