import OpenAI from "openai";
import { supabase } from "./supabase";
import { EMBEDDING_MODEL, CURATED_TRIGGERS } from "./constants";

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
}

export async function retrieve(query: string, topK: number = 6): Promise<RetrievalResult> {
  const result: RetrievalResult = {
    curatedMatch: null,
    chunks: [],
    parentDocuments: [],
    contextText: "",
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
