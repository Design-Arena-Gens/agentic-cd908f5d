import * as vscode from "vscode";
import { createWorkspaceDocument } from "@shared/workspace";
import type { WorkspaceDocument } from "@shared/types";

const decoder = new TextDecoder("utf-8");

const ignoreGlobs = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/.next/**",
  "**/build/**",
  "**/.turbo/**",
  "**/*.lock",
  "**/*.png",
  "**/*.jpg",
  "**/*.jpeg",
  "**/*.svg",
];

export async function collectWorkspaceDocuments(limit = 180): Promise<WorkspaceDocument[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) {
    return [];
  }

  const folder = workspaceFolders[0];
  const uriPattern = new vscode.RelativePattern(folder, "**/*");

  const files = await vscode.workspace.findFiles(uriPattern, `{${ignoreGlobs.join(",")}}`, limit);
  const documents: WorkspaceDocument[] = [];

  for (const file of files) {
    try {
      const fileStat = await vscode.workspace.fs.stat(file);
      if (fileStat.size > 100 * 1024) {
        continue;
      }
      const buffer = await vscode.workspace.fs.readFile(file);
      const content = decoder.decode(buffer);
      const relativePath = vscode.workspace.asRelativePath(file);
      documents.push(createWorkspaceDocument(relativePath, content));
    } catch (error) {
      console.warn("collectWorkspaceDocuments: skip file", file.fsPath, error);
    }
  }

  return documents;
}

export function resolveWorkspaceFolder(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) {
    return null;
  }
  return workspaceFolders[0].uri.fsPath;
}

