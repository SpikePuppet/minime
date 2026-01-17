import { $ } from "bun";
import type { ToolDefinition, RegisteredTool } from "./types";

export const runDefinition: ToolDefinition = {
  name: "run_command",
  description:
    "Execute a shell command and return its output. Use this to run build scripts, tests, git commands, or other CLI tools.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute",
      },
      cwd: {
        type: "string",
        description:
          "Working directory for the command. Defaults to current directory.",
      },
      timeout: {
        type: "number",
        description:
          "Timeout in milliseconds. Defaults to 30000 (30 seconds).",
      },
    },
    required: ["command"],
  },
};

interface RunInput {
  command: string;
  cwd?: string;
  timeout?: number;
}

async function executeRun(input: Record<string, unknown>): Promise<string> {
  const { command, cwd, timeout = 30000 } = input as unknown as RunInput;

  try {
    const proc = Bun.spawn(["sh", "-c", command], {
      cwd: cwd || process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
    });

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill();
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    });

    // Wait for process to complete or timeout
    const exitCode = await Promise.race([proc.exited, timeoutPromise]);

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    let result = "";

    if (stdout.trim()) {
      result += stdout.trim();
    }

    if (stderr.trim()) {
      if (result) result += "\n\n";
      result += `stderr:\n${stderr.trim()}`;
    }

    if (exitCode !== 0) {
      result += `\n\nExit code: ${exitCode}`;
    }

    // Truncate if too long
    const MAX_LENGTH = 50000;
    if (result.length > MAX_LENGTH) {
      return result.slice(0, MAX_LENGTH) + "\n... (output truncated)";
    }

    return result || "(no output)";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error: ${message}`;
  }
}

export const runTool: RegisteredTool = {
  definition: runDefinition,
  execute: executeRun,
};
