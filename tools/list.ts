import { $ } from "bun";
import type { ToolDefinition, RegisteredTool } from "./types";

export const listDefinition: ToolDefinition = {
  name: "list_files",
  description:
    "List files and directories in a given path. Use this to explore the project structure and find files.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "The directory path to list (relative or absolute). Defaults to current directory.",
      },
      recursive: {
        type: "boolean",
        description:
          "If true, list files recursively. Defaults to false.",
      },
      maxDepth: {
        type: "number",
        description:
          "Maximum depth for recursive listing. Only used when recursive is true. Defaults to 3.",
      },
    },
    required: [],
  },
};

interface ListInput {
  path?: string;
  recursive?: boolean;
  maxDepth?: number;
}

async function executeList(input: Record<string, unknown>): Promise<string> {
  const { path = ".", recursive = false, maxDepth = 3 } = input as unknown as ListInput;

  try {
    if (recursive) {
      // Use find for recursive listing
      const result = await $`find ${path} -maxdepth ${maxDepth} -type f -o -type d`.quiet().text();
      const lines = result.trim().split("\n").filter(Boolean);

      // Limit output
      const MAX_ENTRIES = 200;
      if (lines.length > MAX_ENTRIES) {
        return lines.slice(0, MAX_ENTRIES).join("\n") +
          `\n... (truncated, showing ${MAX_ENTRIES} of ${lines.length} entries)`;
      }

      return lines.join("\n") || "No files found.";
    } else {
      // Use ls for non-recursive listing
      const result = await $`ls -la ${path}`.quiet().text();
      return result.trim() || "No files found.";
    }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "stderr" in error) {
      return `Error: ${(error as { stderr: string }).stderr}`;
    }
    const message = error instanceof Error ? error.message : String(error);
    return `Error listing files: ${message}`;
  }
}

export const listTool: RegisteredTool = {
  definition: listDefinition,
  execute: executeList,
};
