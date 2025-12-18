import * as vscode from "vscode";
import { runSelfHealingCommand } from "@shared/selfHealing";
import type { TerminalRunResult } from "@shared/types";

export async function runInSelfHealingTerminal(command: string, cwd: string): Promise<TerminalRunResult> {
  const channel = vscode.window.createOutputChannel("Agentic Architect Terminal");
  channel.appendLine(`> ${command}`);
  channel.show(true);

  const result = await runSelfHealingCommand(command, cwd);
  channel.appendLine(result.stdout);
  if (result.stderr) {
    channel.appendLine(result.stderr);
  }
  if (result.fixesApplied.length) {
    channel.appendLine(`Uygulanan onarımlar: ${result.fixesApplied.join(", ")}`);
  }
  return result;
}

