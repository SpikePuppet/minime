import type { ToolDefinition, ToolCall, ToolResult, RegisteredTool } from "./types";
import { grepTool } from "./grep";
import { readTool } from "./read";
import { writeTool } from "./write";

class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  register(tool: RegisteredTool): void {
    this.tools.set(tool.definition.name, tool);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name);

    if (!tool) {
      return {
        toolUseId: toolCall.id,
        content: `Error: Unknown tool "${toolCall.name}"`,
        isError: true,
      };
    }

    try {
      const content = await tool.execute(toolCall.input);
      return {
        toolUseId: toolCall.id,
        content,
        isError: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        toolUseId: toolCall.id,
        content: `Error executing tool: ${message}`,
        isError: true,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
toolRegistry.register(grepTool);
toolRegistry.register(readTool);
toolRegistry.register(writeTool);
