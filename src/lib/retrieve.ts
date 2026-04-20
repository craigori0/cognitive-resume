import OpenAI from "openai";
import { supabase } from "./supabase";
import { EMBEDDING_MODEL, CURATED_TRIGGERS } from "./constants";
import type { ProjectRow } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------
async function embedQuery(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

// ---------------------------------------------------------------------------
// Curated Q&A matching
// ---------------------------------------------------------------------------
interface CuratedMatch {
  content: string;
  title: string;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "am", "was", "were", "be", "been",
  "do", "does", "did", "can", "could", "would", "should", "will",
  "i", "me", "my", "you", "your", "we", "us", "our", "it", "its",
  "he", "she", "they", "them", "his", "her", "their",
  "to", "of", "in", "on", "at", "for", "with", "from", "by",
  "and", "or", "but", "not", "no", "so",
  "this", "that", "these", "those",
  "tell", "about", "know",
]);

function checkCuratedMatch(query: string): string | null {
  const queryLower = query.toLowerCase().replace(/\?/g, "").trim();
  const queryWords = new Set(queryLower.split(/\s+/));
  const queryContent = new Set([...queryWords].filter((w) => !STOP_WORDS.has(w)));

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [qaId, triggers] of Object.entries(CURATED_TRIGGERS)) {
    for (const trigger of triggers) {
      const triggerWords = new Set(trigger.toLowerCase().split(/\s+/));
      const triggerContent = new Set([...triggerWords].filter((w) => !STOP_WORDS.has(w)));

      // Score on ALL words for basic coverage
      const overlapCount = [...triggerWords].filter((w) => queryWords.has(w)).length;
      const triggerCoverage = overlapCount / triggerWords.size;
      const queryCoverage = overlapCount / queryWords.size;
      const score = Math.min(triggerCoverage, queryCoverage);

      // Also require content word overlap (non-stop-words) to prevent
      // false matches on function words like "tell me about"
      const contentOverlap = [...triggerContent].filter((w) => queryContent.has(w)).length;
      const hasContentMatch = triggerContent.size > 0 ? contentOverlap >= 1 : true;

      if (score > bestScore && score >= 0.5 && hasContentMatch) {
        bestScore = score;
        bestMatch = qaId;
      }
    }
  }

  return bestMatch;
}

async function fetchCuratedResponse(qaId: string): Promise<CuratedMatch | null> {
  const { data } = await supabase
    .from("chunks")
    .select("content, section_heading")
    .eq("metadata->>qa_id", qaId)
    .limit(1);

  if (data && data.length > 0) {
    return {
      content: data[0].content,
      title: data[0].section_heading,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Semantic search
// ---------------------------------------------------------------------------
interface ChunkResult {
  id: string;
  document_id: string;
  section_heading: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  doc_type: string;
  doc_title: string;
}

async function semanticSearch(
  queryEmbedding: number[],
  matchCount: number = 6,
  matchThreshold: number = 0.3
): Promise<ChunkResult[]> {
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (error) {
    console.error("Semantic search error:", error);
    return [];
  }

  return (data as ChunkResult[]) || [];
}

// ---------------------------------------------------------------------------
// Breadth query detection — for "show me all my X experience" style questions,
// pull every matching project row from the project_database instead of the
// top-K semantic hits. This keeps tables complete instead of showing 2 of 9.
// ---------------------------------------------------------------------------
const BREADTH_PATTERNS = [
  /\ball (of )?(your|my|craig'?s?) /i,
  /\ball the /i,
  /\bevery /i,
  /\bfull (list|portfolio|set) /i,
  /\bentire /i,
  /\bshow me (all|every|your|the) /i,
  /\blist (all|every|your|the|out) /i,
  /\bevery (project|client|engagement|piece of work) /i,
  /\bhow many (projects|clients|engagements) /i,
  /\bwhat (projects|clients|work) have (you|i) /i,
  /\b(all|full) experience in /i,
  /\bcomplete (list|portfolio) /i,
  /\bwalk me through (your|the|all) /i,
  // Follow-up / "give me more" phrasings — these catch the second-question
  // pattern like "do you have any other experience in healthcare?" so the
  // user doesn't have to escalate to an explicit "show me all" ask.
  /\bany (other|more) /i,
  /\bother (\w+ )*(experience|projects|work|clients|engagements|examples|case studies) /i,
  /\bmore (of your|examples|experience|projects|work) /i,
  /\bwhat else /i,
  /\banything else /i,
];

// Maps a user-query alias to a set of canonical industry and sector values
// a project can live under. When the user says "healthcare", we want every
// project whose industry OR sector signals healthcare work — that way rows
// like Telehealth Toolbox (industry: Social Impact, sector: Digital Health)
// still surface on a healthcare question.
interface BreadthBucket {
  industries?: string[];
  sectors?: string[];
}

const INDUSTRY_BUCKETS: Record<string, BreadthBucket> = {
  healthcare: {
    industries: ["Healthcare"],
    sectors: [
      "Digital Health",
      "Hospital System",
      "Pharma",
      "Medical Imaging",
      "Consumer Health",
    ],
  },
  "health care": { industries: ["Healthcare"] },
  pharma: { sectors: ["Pharma"] },
  "health tech": { sectors: ["Digital Health"] },
  "digital health": { sectors: ["Digital Health"] },
  "financial services": { industries: ["Financial Services"] },
  finance: { industries: ["Financial Services"] },
  fintech: { industries: ["Financial Services"] },
  banking: { sectors: ["SMB Banking", "Consumer Banking", "Investment Banking", "Trade Finance"] },
  insurance: {
    industries: ["Insurance"],
    sectors: ["Insurance"],
  },
  technology: { industries: ["Technology"] },
  tech: { industries: ["Technology"] },
  telecom: { industries: ["Telecommunications"] },
  telecommunications: { industries: ["Telecommunications"] },
  automotive: { industries: ["Automotive"] },
  "consumer goods": { industries: ["Consumer Goods"] },
  cpg: { industries: ["Consumer Goods"] },
  "social impact": { industries: ["Social Impact"] },
};

// Longest aliases first so "financial services" wins over "finance".
const INDUSTRY_ALIAS_KEYS = Object.keys(INDUSTRY_BUCKETS).sort(
  (a, b) => b.length - a.length
);

// Minimum number of matching rows before we offer a breadth pill. Below
// this, a single case study + surrounding chunks is enough and a table
// would feel thin.
const BREADTH_OFFER_THRESHOLD = 3;

const PROJECT_TYPE_ALIASES: Record<string, string> = {
  "product strategy": "Product Strategy",
  "experience strategy": "Experience Strategy",
  "organizational design": "Organizational Design",
  "org design": "Organizational Design",
  "research strategy": "Research Strategy",
};

interface BreadthFilter {
  industries?: string[]; // match any in metadata.industry
  sectors?: string[]; // match any in metadata.sector
  projectType?: string;
}

// Pulls industry/sector/type from the raw query text. Shared between the
// "full breadth" detector and the "breadth offer" detector — the only
// difference between those two is whether breadth keywords ("all", "every",
// "walk me through") are also present.
interface FocusScope extends BreadthFilter {
  /** Display label — what we'd call this focus area in a UI pill or
   *  prompt nudge, e.g. "healthcare", "fintech", "product strategy". */
  label: string;
}

function detectFocusScope(query: string): FocusScope | null {
  const q = query.toLowerCase();
  let label = "";
  const scope: BreadthFilter = {};

  for (const alias of INDUSTRY_ALIAS_KEYS) {
    if (q.includes(alias)) {
      const bucket = INDUSTRY_BUCKETS[alias];
      scope.industries = bucket.industries;
      scope.sectors = bucket.sectors;
      label = alias;
      break;
    }
  }
  for (const [alias, canonical] of Object.entries(PROJECT_TYPE_ALIASES)) {
    if (q.includes(alias)) {
      scope.projectType = canonical;
      if (!label) label = alias;
      break;
    }
  }

  if (!label) return null;
  return { ...scope, label };
}

function detectBreadthFilter(query: string): BreadthFilter | null {
  const isBreadth = BREADTH_PATTERNS.some((p) => p.test(query));
  if (!isBreadth) return null;

  const scope = detectFocusScope(query);
  if (scope) {
    const { label: _label, ...filter } = scope;
    void _label;
    return filter;
  }

  // No industry/type found. Still treat as breadth when the query references
  // projects/portfolio/experience in general — e.g. "walk me through your
  // portfolio" should return everything.
  if (/\b(portfolio|projects|work|experience|clients)\b/i.test(query)) {
    return {};
  }
  return null;
}

// Tier rank for sorting: Hero first, then Detail, then Context, then unknown.
const TIER_ORDER: Record<string, number> = {
  Hero: 0,
  Detail: 1,
  Context: 2,
};

function parseChunkToProjectRow(chunk: ChunkResult): ProjectRow {
  const m = (chunk.metadata || {}) as Record<string, string>;
  const body = chunk.content || "";

  const grab = (label: string): string => {
    const re = new RegExp(`^${label}:\\s*(.+)$`, "m");
    return re.exec(body)?.[1]?.trim() ?? "";
  };

  const year = m.year || grab("Year");
  const years = [...year.matchAll(/\d{4}/g)].map((x) => Number(x[0]));
  const yearSort = years.length ? Math.max(...years) : 0;

  return {
    client: m.client || grab("Client"),
    year,
    yearSort,
    projectType: m.project_type || grab("Project Type"),
    industry: m.industry || grab("Industry"),
    sector: m.sector || grab("Sector"),
    businessChallenge: grab("Business Challenge"),
    coreQuestion: grab("Core Question"),
    outcome: grab("Outcome"),
    tier: m.tier || grab("Tier"),
    caseStudyRef: m.case_study_ref || "",
  };
}

function sortProjectRows(rows: ProjectRow[]): ProjectRow[] {
  return [...rows].sort((a, b) => {
    const ta = TIER_ORDER[a.tier] ?? 3;
    const tb = TIER_ORDER[b.tier] ?? 3;
    if (ta !== tb) return ta - tb;
    if (a.yearSort !== b.yearSort) return b.yearSort - a.yearSort;
    return a.client.localeCompare(b.client);
  });
}

async function fetchProjectRows(
  filter: BreadthFilter
): Promise<ChunkResult[]> {
  // Pull all project chunks (dataset is ~39 rows) and filter in JS. This
  // gives us OR semantics across industry + sector, which is what we need
  // so e.g. "healthcare" also surfaces rows marked industry=Social Impact
  // but sector=Digital Health (like Telehealth Toolbox).
  const { data, error } = await supabase
    .from("chunks")
    .select(
      "id, document_id, section_heading, content, metadata, documents!inner(doc_type, title)"
    )
    .eq("documents.doc_type", "project")
    .limit(100);

  if (error || !data) {
    if (error) console.error("Breadth project fetch error:", error);
    return [];
  }

  const rows = data.map((row: Record<string, unknown>) => {
    const docs = row.documents as { doc_type: string; title: string } | null;
    return {
      id: row.id as string,
      document_id: row.document_id as string,
      section_heading: (row.section_heading as string) || "",
      content: row.content as string,
      metadata: (row.metadata as Record<string, unknown>) || {},
      similarity: 1, // surfaced by filter, not similarity
      doc_type: docs?.doc_type || "project",
      doc_title: docs?.title || "",
    };
  });

  const industrySet = filter.industries
    ? new Set(filter.industries.map((s) => s.toLowerCase()))
    : null;
  const sectorSet = filter.sectors
    ? new Set(filter.sectors.map((s) => s.toLowerCase()))
    : null;
  const projectType = filter.projectType?.toLowerCase();

  return rows.filter((r) => {
    const m = (r.metadata || {}) as Record<string, string>;
    const industry = (m.industry || "").toLowerCase();
    const sector = (m.sector || "").toLowerCase();
    const ptype = (m.project_type || "").toLowerCase();

    const industryOk = !industrySet && !sectorSet
      ? true
      : (industrySet?.has(industry) ?? false) ||
        (sectorSet?.has(sector) ?? false);
    const typeOk = !projectType ? true : ptype === projectType;
    return industryOk && typeOk;
  });
}

// ---------------------------------------------------------------------------
// Parent document retrieval
// ---------------------------------------------------------------------------
interface ParentDocument {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  doc_type: string;
}

async function getParentDocuments(documentIds: string[]): Promise<ParentDocument[]> {
  if (documentIds.length === 0) return [];

  const { data } = await supabase
    .from("documents")
    .select("*")
    .in("id", documentIds);

  if (!data) return [];

  return data.map((doc) => ({
    ...doc,
    metadata: typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata,
  }));
}

// ---------------------------------------------------------------------------
// Context formatting
// ---------------------------------------------------------------------------
function stripQaPrefix(text: string): string {
  return text.replace(/^Q\d+:\s*/, "");
}

function formatCuratedContext(curated: CuratedMatch): string {
  const title = stripQaPrefix(curated.title);
  return `[CURATED RESPONSE — Use this as the primary answer]\nQuestion: ${title}\nAnswer: ${curated.content}\n`;
}

function formatRetrievalContext(
  chunks: ChunkResult[],
  parentDocs: ParentDocument[]
): string {
  const parts: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let header = `[Source ${i + 1}: ${chunk.doc_type} — ${chunk.doc_title}`;
    if (chunk.section_heading) header += ` / ${chunk.section_heading}`;
    header += ` (relevance: ${chunk.similarity.toFixed(2)})]`;
    parts.push(`${header}\n${chunk.content}`);
  }

  if (parentDocs.length > 0) {
    parts.push("\n--- PARENT DOCUMENTS (full case studies for matched sections) ---");
    for (const doc of parentDocs) {
      const meta = doc.metadata || {};
      parts.push(
        `\n[Full Case Study: ${doc.title}]\n` +
          `Industry: ${(meta as Record<string, string>).industry || "N/A"} | ` +
          `Role: ${(meta as Record<string, string>).role || "N/A"} | ` +
          `Year: ${(meta as Record<string, string>).year || "N/A"}\n` +
          `${doc.content.substring(0, 2000)}...`
      );
    }
  }

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Main retrieval pipeline
// ---------------------------------------------------------------------------
export interface RetrievalResult {
  curatedMatch: CuratedMatch | null;
  chunks: ChunkResult[];
  parentDocuments: ParentDocument[];
  contextText: string;
  /** Populated only for "breadth" queries (e.g. "show me all my healthcare
   *  projects"). Pre-sorted tier → year desc. The API streams these to the
   *  client as structured JSON so the UI can render an interactive table
   *  instead of a Claude-generated markdown table. */
  breadthProjects: ProjectRow[];
  /** Populated on depth queries that reference a focus area with enough
   *  matching rows to be worth surfacing as a table. The API uses this to
   *  ask Claude to close with a nudge line and inject a "See all my X work"
   *  pill into <followups>. */
  breadthOffer?: {
    label: string;
    count: number;
  };
}

export async function retrieve(query: string, topK: number = 6): Promise<RetrievalResult> {
  const result: RetrievalResult = {
    curatedMatch: null,
    chunks: [],
    parentDocuments: [],
    contextText: "",
    breadthProjects: [],
  };

  // Step 1: Check curated Q&A
  const curatedId = checkCuratedMatch(query);
  if (curatedId) {
    const curated = await fetchCuratedResponse(curatedId);
    if (curated) {
      result.curatedMatch = curated;
      result.contextText = formatCuratedContext(curated);
    }
  }

  // Step 2: Semantic search
  const queryEmbedding = await embedQuery(query);
  let chunks = await semanticSearch(queryEmbedding, topK);

  // Deduplicate: remove the curated chunk from semantic results so it
  // doesn't appear twice in the context
  if (curatedId && result.curatedMatch) {
    chunks = chunks.filter(
      (c) => (c.metadata as Record<string, string>)?.qa_id !== curatedId
    );
  }

  // Step 2b: Breadth query — if the user asked for "all"/"every"/"full list"
  // style questions, fetch the full set of matching project rows.
  // We keep them out of the chunks list (so Claude doesn't hand-write a long
  // markdown table) and hand them back as structured rows. The API route
  // streams them as JSON for the client to render as an interactive table.
  const breadthFilter = detectBreadthFilter(query);
  if (breadthFilter) {
    const projectChunks = await fetchProjectRows(breadthFilter);
    if (projectChunks.length > 0) {
      const rows = sortProjectRows(
        projectChunks.map(parseChunkToProjectRow)
      );
      result.breadthProjects = rows;
    }
  } else {
    // Step 2c: Breadth offer — depth query that references a specific focus
    // area. If there are enough matching rows, flag it so the API can
    // inject a "See all my X work" pill. This teaches users the table
    // mode exists without forcing a table they didn't ask for.
    const focusScope = detectFocusScope(query);
    if (focusScope) {
      const { label, ...offerFilter } = focusScope;
      const projectChunks = await fetchProjectRows(offerFilter);
      if (projectChunks.length >= BREADTH_OFFER_THRESHOLD) {
        result.breadthOffer = { label, count: projectChunks.length };
      }
    }
  }

  result.chunks = chunks;

  // Step 3: Parent document fallback for case studies (batched query)
  const caseStudyDocIds = [...new Set(
    chunks
      .filter((c) => c.document_id && c.doc_type === "case_study")
      .map((c) => c.document_id)
  )];
  const parentDocs = await getParentDocuments(caseStudyDocIds);
  result.parentDocuments = parentDocs;

  // Step 4: Format context
  if (!result.contextText) {
    result.contextText = formatRetrievalContext(chunks, parentDocs);
  } else {
    const supplemental = formatRetrievalContext(chunks, parentDocs);
    if (supplemental) {
      result.contextText += `\n\n---\nAdditional context from knowledge base:\n${supplemental}`;
    }
  }

  return result;
}
