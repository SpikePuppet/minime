import type { ToolDefinition, RegisteredTool } from "./types";

export const editDefinition: ToolDefinition = {
  name: "edit_file",
  description:
    "Make targeted edits to a file by replacing specific text. Use this to modify existing code without rewriting the entire file. The old_string must match exactly (including whitespace and indentation).",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to edit (relative or absolute)",
      },
      old_string: {
        type: "string",
        description: "The exact text to find and replace (must match exactly)",
      },
      new_string: {
        type: "string",
        description: "The text to replace it with",
      },
    },
    required: ["path", "old_string", "new_string"],
  },
};

interface EditInput {
  path: string;
  old_string: string;
  new_string: string;
}

async function executeEdit(input: Record<string, unknown>): Promise<string> {
  const { path, old_string, new_string } = input as unknown as EditInput;

  const file = Bun.file(path);

  if (!(await file.exists())) {
    return `Error: File not found: ${path}`;
  }

  const content = await file.text();

  // Check if old_string exists in the file
  if (!content.includes(old_string)) {
    return `Error: Could not find the specified text in ${path}. Make sure old_string matches exactly (including whitespace and indentation).`;
  }

  // Check for multiple occurrences
  const occurrences = content.split(old_string).length - 1;
  if (occurrences > 1) {
    return `Error: Found ${occurrences} occurrences of the specified text. Please provide a more unique string to avoid ambiguity.`;
  }

  // Perform the replacement
  const newContent = content.replace(old_string, new_string);

  try {
    await Bun.write(path, newContent);
    return `Successfully edited ${path}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error writing file: ${message}`;
  }
}

export const editTool: RegisteredTool = {
  definition: editDefinition,
  execute: executeEdit,
};
