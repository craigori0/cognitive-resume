import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craig Cisero — RAG Resume",
  description:
    "A cognitive system designed to help you get to know Craig Cisero through conversation. Strategy & Research Director with 12+ years across healthcare, fintech, food delivery, and tech.",
  openGraph: {
    title: "Craig Cisero — RAG Resume",
    description:
      "A conversational resume powered by a cognitive system. Ask me anything about my work, approach, or what I'm looking for next.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
