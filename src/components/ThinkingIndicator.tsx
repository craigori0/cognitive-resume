"use client";

import { useState, useEffect } from "react";

const bars = [
  { h: 6, delay: "0ms" },
  { h: 7, delay: "100ms" },
  { h: 9, delay: "200ms" },
  { h: 12, delay: "300ms" },
  { h: 15, delay: "400ms" },
];

const PHASES = [
  "Reading through relevant work…",
  "Thinking…",
  "Articulating…",
];

const PHASE_INTERVAL = 2400;

export default function ThinkingIndicator() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhaseIndex((prev) => Math.min(prev + 1, PHASES.length - 1));
    }, PHASE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-3 py-2">
        <div className="flex items-end gap-[3px] h-4">
          {bars.map((b, i) => (
            <span
              key={i}
              className="thinking-bar inline-block w-[3px] rounded-full bg-[rgba(181,112,63,0.5)]"
              style={{ height: `${b.h}px`, animationDelay: b.delay }}
            />
          ))}
        </div>
        <span
          key={phaseIndex}
          className="text-[14px] leading-[21px] text-[rgba(31,27,22,0.4)] animate-fadeIn"
        >
          {PHASES[phaseIndex]}
        </span>
      </div>
    </div>
  );
}
