import { exec as execCallback, ExecOptions } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import { TerminalRunResult } from "./types";

const exec = promisify(execCallback);
const preferredShell = process.platform === "win32" ? "powershell.exe" : "/bin/sh";

async function detectPackageManager(cwd: string) {
  const files = await fs.readdir(cwd);
  if (files.includes("pnpm-lock.yaml")) {
    return { install: "pnpm add", exec: "pnpm" };
  }
  if (files.includes("yarn.lock")) {
    return { install: "yarn add", exec: "yarn" };
  }
  if (files.includes("bun.lockb")) {
    return { install: "bun add", exec: "bun" };
  }
  return { install: "npm install", exec: "npm" };
}

interface HeuristicFix {
  match: RegExp;
  apply: (cwd: string, match: RegExpMatchArray) => Promise<string | null>;
}

const heuristics: HeuristicFix[] = [
  {
    match: /Cannot find module '(.*?)'/i,
    apply: async (cwd, match) => {
      const pkg = match[1];
      if (!pkg) return null;
      const { install } = await detectPackageManager(cwd);
      await exec(`${install} ${pkg}`, { cwd, shell: preferredShell });
      return `${install} ${pkg}`;
    },
  },
  {
    match: /ModuleNotFoundError: No module named '(.*?)'/i,
    apply: async (cwd, match) => {
      const pkg = match[1];
      if (!pkg) return null;
      await exec(`pip install ${pkg}`, { cwd, shell: preferredShell });
      return `pip install ${pkg}`;
    },
  },
  {
    match: /TS2307: Cannot find module '(.*?)'/i,
    apply: async (cwd, match) => {
      const pkg = match[1];
      if (!pkg) return null;
      const { install } = await detectPackageManager(cwd);
      await exec(`${install} ${pkg}`, { cwd, shell: preferredShell });
      return `${install} ${pkg}`;
    },
  },
  {
    match: /SyntaxError: Unexpected token 'export'/i,
    apply: async (cwd) => {
      const packageJsonPath = path.join(cwd, "package.json");
      try {
        const pkgContents = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
        if (pkgContents.type !== "module") {
          pkgContents.type = "module";
          await fs.writeFile(packageJsonPath, `${JSON.stringify(pkgContents, null, 2)}\n`, "utf8");
          return "Ayarlanan package.json -> type: module";
        }
      } catch {
        return null;
      }
      return null;
    },
  },
];

export async function runSelfHealingCommand(command: string, cwd: string): Promise<TerminalRunResult> {
  let attempts = 0;
  const fixesApplied: string[] = [];
  let lastStdout = "";
  let lastStderr = "";

  while (attempts < 3) {
    attempts += 1;
    try {
      const execOptions: ExecOptions = { cwd, shell: preferredShell };
      const { stdout, stderr } = await exec(command, execOptions);
      const stdoutStr = typeof stdout === "string" ? stdout : stdout?.toString("utf8") ?? "";
      const stderrStr = typeof stderr === "string" ? stderr : stderr?.toString("utf8") ?? "";
      lastStdout = stdoutStr;
      lastStderr = stderrStr;
      return {
        command,
        attempts,
        success: true,
        stdout: stdoutStr,
        stderr: stderrStr,
        fixesApplied,
      };
    } catch (error: any) {
      const stdoutErr = error.stdout;
      const stderrErr = error.stderr;
      lastStdout =
        typeof stdoutErr === "string"
          ? stdoutErr
          : stdoutErr?.toString?.("utf8") ?? "";
      lastStderr =
        typeof stderrErr === "string"
          ? stderrErr
          : stderrErr?.toString?.("utf8") ?? error.message ?? "";

      let fixApplied = false;
      for (const heuristic of heuristics) {
        const match = lastStderr.match(heuristic.match);
        if (match) {
          const fix = await heuristic.apply(cwd, match);
          if (fix) {
            fixesApplied.push(fix);
            fixApplied = true;
            break;
          }
        }
      }

      if (!fixApplied) {
        break;
      }
    }
  }

  return {
    command,
    attempts,
    success: false,
    stdout: lastStdout,
    stderr: lastStderr,
    fixesApplied,
  };
}
