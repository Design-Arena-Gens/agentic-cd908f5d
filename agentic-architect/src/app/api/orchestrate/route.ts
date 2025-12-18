import { NextRequest } from "next/server";
import { runOrchestration } from "@shared/agents";
import { embedWorkspace } from "@shared/vector";
import { createWorkspaceDocument } from "@shared/workspace";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const specification: string = body.specification ?? "";
    const files: { path: string; content: string }[] = Array.isArray(body.files) ? body.files : [];
    const tests: string[] = Array.isArray(body.tests) ? body.tests : [];

    if (!specification.trim()) {
      return Response.json(
        { error: "specification_required" },
        { status: 400 },
      );
    }

    const documents = files.map((file) => createWorkspaceDocument(file.path, file.content));
    const embeddings = embedWorkspace(documents);
    const result = runOrchestration({
      specification,
      workspace: documents,
      embeddings,
      tests,
    });

    return Response.json(result);
  } catch (error) {
    console.error("orchestrate api error", error);
    return Response.json(
      {
        error: "unexpected_error",
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}

