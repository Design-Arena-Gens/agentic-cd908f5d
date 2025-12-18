import { embedWorkspace } from "@shared/vector";
import { runOrchestration } from "@shared/agents";
import type { OrchestrationResult, WorkspaceDocument } from "@shared/types";

export function orchestrateWorkspace(
  specification: string,
  documents: WorkspaceDocument[],
  tests: string[],
): OrchestrationResult {
  const embeddings = embedWorkspace(documents);
  return runOrchestration({
    specification,
    workspace: documents,
    embeddings,
    tests,
  });
}

