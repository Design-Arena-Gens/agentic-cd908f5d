import crypto from "crypto";
import path from "path";
import { WorkspaceDocument, WorkspaceInsights } from "./types";

const languageMap: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript React",
  ".js": "JavaScript",
  ".jsx": "JavaScript React",
  ".json": "JSON",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".cs": "C#",
  ".rb": "Ruby",
  ".php": "PHP",
  ".md": "Markdown",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
};

export function inferLanguage(filePath: string) {
  const ext = path.extname(filePath);
  return languageMap[ext] ?? "PlainText";
}

export function createWorkspaceDocument(filePath: string, content: string): WorkspaceDocument {
  const hash = crypto.createHash("sha1").update(content).digest("hex");
  const language = inferLanguage(filePath);
  const tokens = content.trim().split(/\s+/).length;

  return {
    path: filePath,
    content,
    language,
    hash,
    tokens,
  };
}

export function summarizeWorkspace(documents: WorkspaceDocument[]): WorkspaceInsights {
  const languages: Record<string, number> = {};
  for (const doc of documents) {
    languages[doc.language] = (languages[doc.language] ?? 0) + 1;
  }

  const topFiles = [...documents]
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 8);

  return {
    totalFiles: documents.length,
    languages,
    topFiles,
    modifiedAt: new Date().toISOString(),
  };
}

