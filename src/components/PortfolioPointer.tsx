import Link from "next/link";

function FolderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ArrowIcon() {
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
      aria-hidden
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function PortfolioPointer() {
  return (
    <Link
      href="/about#portfolio"
      className="not-prose mt-5 inline-flex items-center gap-3 max-w-full pl-4 pr-5 py-3 rounded-[12px] border border-[rgba(31,27,22,0.1)] bg-white/60 hover:bg-white hover:border-[rgba(31,27,22,0.18)] transition-colors group"
    >
      <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(181,112,63,0.1)] text-[#b5703f]">
        <FolderIcon />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[14px] font-medium text-[#1f1b16]">
          See the work itself
        </span>
        <span className="text-[12px] text-[rgba(31,27,22,0.55)]">
          Browse the portfolio book on the About page
        </span>
      </span>
      <span className="ml-2 text-[rgba(31,27,22,0.4)] group-hover:text-[#1f1b16] group-hover:translate-x-0.5 transition-all">
        <ArrowIcon />
      </span>
    </Link>
  );
}
