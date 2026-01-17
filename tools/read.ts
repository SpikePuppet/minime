import type { ToolDefinition, RegisteredTool } from "./types";

export const readDefinition: ToolDefinition = {
  name: "read_file",
  description:
    "Read the contents of a file. Use this to understand code before making changes.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to read (relative or absolute)",
      },
      startLine: {
        type: "number",
        description:
          "Optional starting line number (1-indexed). If omitted, reads from beginning.",
      },
      endLine: {
        type: "number",
        description:
          "Optional ending line number (inclusive). If omitted, reads to end.",
      },
    },
    required: ["path"],
  },
};

interface ReadInput {
  path: string;
  startLine?: number;
  endLine?: number;
}

async function executeRead(input: Record<string, unknown>): Promise<string> {
  const { path, startLine, endLine } = input as unknown as ReadInput;

  const file = Bun.file(path);

  if (!(await file.exists())) {
    return `Error: File not found: ${path}`;
  }

  const content = await file.text();
  const lines = content.split("\n");

  // Apply line range if specified
  const start = startLine ? startLine - 1 : 0;
  const end = endLine ? endLine : lines.length;
  const selectedLines = lines.slice(start, end);

  // Add line numbers
  const numbered = selectedLines.map((line, i) => `${start + i + 1}: ${line}`);

  // Truncate if too long (prevent token overflow)
  const MAX_LINES = 500;
  if (numbered.length > MAX_LINES) {
    return (
      numbered.slice(0, MAX_LINES).join("\n") +
      `\n... (truncated, showing ${MAX_LINES} of ${numbered.length} lines)`
    );
  }

  return numbered.join("\n");
}

export const readTool: RegisteredTool = {
  definition: readDefinition,
  execute: executeRead,
};
