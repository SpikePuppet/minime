import type { ToolDefinition, RegisteredTool } from "./types";

export const writeDefinition: ToolDefinition = {
  name: "write_file",
  description:
    "Write content to a file. Creates the file if it doesn't exist, or overwrites if it does. Use this to create new files or completely replace file contents.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to write (relative or absolute)",
      },
      content: {
        type: "string",
        description: "The content to write to the file",
      },
    },
    required: ["path", "content"],
  },
};

interface WriteInput {
  path: string;
  content: string;
}

async function executeWrite(input: Record<string, unknown>): Promise<string> {
  const { path, content } = input as unknown as WriteInput;

  try {
    await Bun.write(path, content);
    const lines = content.split("\n").length;
    return `Successfully wrote ${lines} lines to ${path}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error writing file: ${message}`;
  }
}

export const writeTool: RegisteredTool = {
  definition: writeDefinition,
  execute: executeWrite,
};
