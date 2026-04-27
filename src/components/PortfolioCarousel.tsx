"use client";

import { useCallback, useEffect, useState } from "react";

const PAGE_COUNT = 14;
const PAGES = Array.from({ length: PAGE_COUNT }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return {
    src: `/portfolio/page-${num}.jpg`,
    alt: `Portfolio page ${i + 1} of ${PAGE_COUNT}`,
  };
});

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: direction === "left" ? "rotate(180deg)" : undefined,
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

export default function PortfolioCarousel() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const goPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + PAGE_COUNT) % PAGE_COUNT)),
    [],
  );
  const goNext = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % PAGE_COUNT)),
    [],
  );

  // Keyboard nav + body scroll lock when lightbox is open
  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [openIndex, close, goPrev, goNext]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-[rgba(31,27,22,0.4)]">
          Scroll horizontally · click any page to expand
        </p>
        <button
          onClick={() => setOpenIndex(0)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[rgba(31,27,22,0.1)] text-[13px] font-medium text-[rgba(31,27,22,0.6)] hover:text-[#1f1b16] hover:border-[rgba(31,27,22,0.2)] transition-colors"
        >
          <ExpandIcon />
          Expand view
        </button>
      </div>
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {PAGES.map((page, i) => (
          <button
            key={page.src}
            onClick={() => setOpenIndex(i)}
            className="group relative shrink-0 snap-start rounded-[6px] overflow-hidden bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.06)] transition-shadow"
            aria-label={`Open ${page.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.src}
              alt={page.alt}
              loading={i < 3 ? "eager" : "lazy"}
              className="block h-[340px] w-auto object-contain"
            />
            <span className="absolute bottom-2 right-2 px-2 py-[2px] rounded text-[10px] font-semibold tracking-[0.4px] uppercase bg-[rgba(31,27,22,0.55)] text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {i + 1} / {PAGE_COUNT}
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-[rgba(31,27,22,0.92)] flex items-center justify-center p-6 sm:p-12"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio viewer"
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close portfolio viewer"
          >
            <CloseIcon />
          </button>

          {/* Page counter */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 px-3 py-1.5 rounded-full bg-white/10 text-white text-[12px] font-medium tracking-[0.3px]">
            {openIndex + 1} / {PAGE_COUNT}
          </div>

          {/* Prev */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 sm:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Previous page"
          >
            <ChevronIcon direction="left" />
          </button>

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PAGES[openIndex].src}
            alt={PAGES[openIndex].alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-[4px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          />

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Next page"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      )}
    </>
  );
}
