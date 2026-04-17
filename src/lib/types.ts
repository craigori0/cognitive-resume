/** Chat message exchanged between client and API */
export interface Message {
  role: "user" | "assistant";
  content: string;
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
