import { $ } from "bun";
import type { ToolDefinition, RegisteredTool } from "./types";

export const grepDefinition: ToolDefinition = {
  name: "grep",
  description:
    "Search for patterns in files using ripgrep. Returns matching lines with file paths and line numbers. Use this to search codebases for specific patterns, function names, variables, or text.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "The regex pattern to search for",
      },
      path: {
        type: "string",
        description: "Directory or file to search in. Defaults to current directory.",
      },
      fileType: {
        type: "string",
        description: "File type filter (e.g., 'ts', 'js', 'py')",
      },
      caseSensitive: {
        type: "boolean",
        description: "Case sensitive search. Defaults to false.",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results to return. Defaults to 50.",
      },
    },
    required: ["pattern"],
  },
};

interface GrepInput {
  pattern: string;
  path?: string;
  fileType?: string;
  caseSensitive?: boolean;
  maxResults?: number;
}

async function executeGrep(input: Record<string, unknown>): Promise<string> {
  const grepInput = input as unknown as GrepInput;
  const {
    pattern,
    path = ".",
    fileType,
    caseSensitive = false,
    maxResults = 50,
  } = grepInput;

  const args: string[] = ["-n", "--color=never"];

  if (!caseSensitive) {
    args.push("-i");
  }

  if (fileType) {
    args.push("-t", fileType);
  }

  args.push(pattern);
  args.push(path);

  try {
    const result = await $`rg ${args}`.quiet().text();
    const lines = result.trim().split("\n");
    const limited = lines.slice(0, maxResults);
    return limited.join("\n") || "No matches found.";
  } catch (error: unknown) {
    // ripgrep returns exit code 1 when no matches found
    if (error && typeof error === "object" && "exitCode" in error && error.exitCode === 1) {
      return "No matches found.";
    }

    // Try fallback to grep -r
    try {
      const grepArgs: string[] = ["-rn"];
      if (!caseSensitive) {
        grepArgs.push("-i");
      }
      if (fileType) {
        grepArgs.push("--include", `*.${fileType}`);
      }
      grepArgs.push(pattern);
      grepArgs.push(path);

      const result = await $`grep ${grepArgs}`.quiet().text();
      const lines = result.trim().split("\n").slice(0, maxResults);
      return lines.join("\n") || "No matches found.";
    } catch {
      return "No matches found.";
    }
  }
}

export const grepTool: RegisteredTool = {
  definition: grepDefinition,
  execute: executeGrep,
};
