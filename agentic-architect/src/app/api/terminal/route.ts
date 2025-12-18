import { NextRequest } from "next/server";
import { runSelfHealingCommand } from "@shared/selfHealing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    if (!command || typeof command !== "string") {
      return Response.json(
        { error: "command_required" },
        { status: 400 },
      );
    }

    const result = await runSelfHealingCommand(command, process.cwd());
    return Response.json(result);
  } catch (error) {
    console.error("terminal api error", error);
    return Response.json(
      {
        error: "unexpected_error",
        message: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}

