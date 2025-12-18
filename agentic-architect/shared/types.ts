export type AgentRole = "manager" | "coder" | "reviewer";

export interface AgentMessage {
  role: AgentRole;
  content: string;
  reasoning: string;
  timestamp: string;
}

export interface PlanStep {
  id: string;
  summary: string;
  rationale: string;
  dependencies: string[];
  status: "pending" | "in-progress" | "done" | "needs-attention";
}

export interface WorkspaceDocument {
  path: string;
  content: string;
  language: string;
  hash: string;
  tokens: number;
}

export interface WorkspaceInsights {
  totalFiles: number;
  languages: Record<string, number>;
  topFiles: WorkspaceDocument[];
  modifiedAt: string;
}

export interface VectorEmbedding {
  path: string;
  vector: Float32Array;
  norm: number;
  preview: string;
}

export interface VectorQueryResult {
  path: string;
  preview: string;
  similarity: number;
}

export interface OrchestrationInput {
  specification: string;
  workspace: WorkspaceDocument[];
  embeddings: VectorEmbedding[];
  tests?: string[];
}

export interface OrchestrationResult {
  plan: PlanStep[];
  codingNotes: AgentMessage[];
  reviewNotes: AgentMessage[];
  relevantContext: VectorQueryResult[];
  suggestedCommands: string[];
}

export interface TerminalRunResult {
  command: string;
  attempts: number;
  success: boolean;
  stdout: string;
  stderr: string;
  fixesApplied: string[];
}

