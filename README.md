# Cognitive Resume

A RAG-powered conversational resume for [Craig Cisero](https://ciserodesign.co) — Strategy & Research Director, 12+ years at frog design.

Instead of a static PDF, this is a cognitive system you can talk to. It retrieves from a structured knowledge base Craig authored (case studies, knowledge objects, curated Q&A, and a professional thesis) and composes grounded responses via Claude.

**The medium is the message.** Craig's thesis is that cognitive systems will drive the next wave of product innovation. This site demonstrates that thesis by being one.

## Architecture

- **Corpus** — Case studies, knowledge objects, curated Q&A, and a professional thesis authored in markdown
- **Embeddings** — OpenAI `text-embedding-3-small` (1536 dims)
- **Vector store** — Supabase pgvector, section-level chunking with metadata
- **Retrieval** — Curated trigger matching → semantic vector search → parent document hydration
- **Generation** — Anthropic Claude (streaming)
- **Frontend** — Next.js 16, Tailwind CSS, TypeScript

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v3
- Supabase (pgvector)
- OpenAI API (embeddings)
- Anthropic SDK (chat)

## Local Development

```bash
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

## Environment Variables

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## Contact

Craig Cisero — craig@ciserodesign.co
