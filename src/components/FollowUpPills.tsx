"use client";

const GRASS_PILL = "Enough AI talk, let\u2019s touch grass.";

interface FollowUpPillsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export default function FollowUpPills({
  prompts,
  onSelect,
}: FollowUpPillsProps) {
  if (prompts.length === 0) return null;

  const RESET_PROMPT = "What else can I ask you about?";

  const regularPrompts = prompts.filter((p) => p !== GRASS_PILL);
  const hasGrass = prompts.includes(GRASS_PILL);

  return (
    <div className="flex flex-wrap justify-start gap-2 mb-2 animate-fadeIn">
      {regularPrompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="px-3 py-1.5 rounded-full text-[12px] leading-[1.4] font-light text-[rgba(31,27,22,0.55)] bg-transparent border border-[rgba(31,27,22,0.12)] hover:border-[rgba(31,27,22,0.25)] hover:text-[rgba(31,27,22,0.75)] transition-colors cursor-pointer"
        >
          {prompt}
        </button>
      ))}
      <button
        onClick={() => onSelect(RESET_PROMPT)}
        className="px-3 py-1.5 rounded-full text-[12px] leading-[1.4] font-light text-[rgba(31,27,22,0.35)] bg-transparent border border-dashed border-[rgba(31,27,22,0.10)] hover:border-[rgba(31,27,22,0.20)] hover:text-[rgba(31,27,22,0.55)] transition-colors cursor-pointer"
      >
        Let&apos;s talk about something else
      </button>
      {hasGrass && (
        <button
          onClick={() => onSelect(GRASS_PILL)}
          className="grass-pill px-3 py-1.5 rounded-full text-[12px] leading-[1.4] font-light text-green-700/60 bg-green-50/60 border border-green-300/30 hover:bg-green-100/80 hover:text-green-800/80 hover:border-green-400/40 transition-colors cursor-pointer"
        >
          {GRASS_PILL}
        </button>
      )}
    </div>
  );
}
