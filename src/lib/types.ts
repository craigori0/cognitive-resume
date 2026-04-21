/** Chat message exchanged between client and API */
export interface Message {
  role: "user" | "assistant";
  content: string;
  /** Structured project rows returned by the server for breadth queries.
   *  When present, MessageBubble renders an interactive ProjectTable
   *  component below the prose instead of relying on a markdown table. */
  projectRows?: ProjectRow[];
  /** Which tab ProjectTable should open on. Server sends "all" when the
   *  query contained an explicit exhaustive marker ("all projects",
   *  "complete portfolio", etc.), otherwise "top". */
  projectTableDefaultView?: "all" | "top";
}

/** One row of Craig's project database, returned to the client as
 *  structured JSON for interactive tables. */
export interface ProjectRow {
  client: string;
  year: string;
  /** Last 4-digit year found in `year`, used for sorting newest-first. */
  yearSort: number;
  projectType: string;
  industry: string;
  sector: string;
  businessChallenge: string;
  coreQuestion: string;
  outcome: string;
  /** "Hero" | "Detail" | "Context" | "" */
  tier: string;
  /** Slug of the hero case study, if any (e.g. "hoag_case_study"). */
  caseStudyRef: string;
}

/** A single SSE chunk from the streaming API */
export interface StreamChunk {
  text: string;
}

/** Metadata stored on curated Q&A chunks */
export interface CuratedMetadata {
  qa_id: string;
  trigger_patterns?: string[];
}

/** Metadata stored on knowledge object chunks */
export interface KnowledgeObjectMetadata {
  ko_id: string;
  source_type: string;
  topic: string;
  skills_demonstrated?: string[];
  related_projects?: string[];
  tags?: string[];
}

/** Metadata stored on case study chunks */
export interface CaseStudyMetadata {
  case_study: string;
  section: string;
  industry?: string;
  skills?: string[];
  year?: string;
  client?: string;
}
