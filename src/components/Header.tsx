"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, PersonIcon, LinkedInIcon } from "./Icons";

const dockBase =
  "flex items-center justify-center w-8 h-8 rounded-full text-[#1f1b16] transition-colors";

function dispatchReset() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("chat:reset"));
  }
}

export default function Header() {
  const pathname = usePathname();
  const isChat = pathname === "/";
  const isAbout = pathname === "/about";

  const handleHomeClick = () => {
    if (isChat) dispatchReset();
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-10 pt-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          onClick={handleHomeClick}
          className="font-light text-[18px] tracking-[-0.18px] text-[#1f1b16]"
        >
          Craig RAG
        </Link>

        <nav
          className="flex items-center gap-1 h-11 px-2 rounded-full bg-white/60 border border-[rgba(31,27,22,0.07)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] backdrop-blur-sm"
          aria-label="Primary"
        >
          <Link
            href="/"
            onClick={handleHomeClick}
            aria-label="Chat"
            aria-current={isChat ? "page" : undefined}
            className={`${dockBase} ${
              isChat
                ? "bg-[rgba(31,27,22,0.1)]"
                : "hover:bg-[rgba(31,27,22,0.06)]"
            }`}
          >
            <ChatIcon />
          </Link>
          <Link
            href="/about"
            aria-label="About"
            aria-current={isAbout ? "page" : undefined}
            className={`${dockBase} ${
              isAbout
                ? "bg-[rgba(31,27,22,0.1)]"
                : "hover:bg-[rgba(31,27,22,0.06)]"
            }`}
          >
            <PersonIcon />
          </Link>
          <a
            href="https://www.linkedin.com/in/craigcisero/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className={`${dockBase} hover:bg-[rgba(31,27,22,0.06)]`}
          >
            <LinkedInIcon />
          </a>
        </nav>
      </div>
    </header>
  );
}
