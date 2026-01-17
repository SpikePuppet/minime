export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolUseId: string;
  content: string;
  isError: boolean;
}

export interface TextContent {
  type: "text";
  text: string;
}

export interface ToolUseContent {
  type: "tool_use";
  toolCall: ToolCall;
}

export interface ToolResultContent {
  type: "tool_result";
  toolResult: ToolResult;
}

export type MessageContent = TextContent | ToolUseContent | ToolResultContent;

export interface ExtendedMessage {
  role: "user" | "assistant";
  content: string | MessageContent[];
}

export interface ChatResponse {
  content: string;
  toolCalls: ToolCall[];
  stopReason: "end_turn" | "tool_use" | "max_tokens";
}

export interface RegisteredTool {
  definition: ToolDefinition;
  execute: (input: Record<string, unknown>) => Promise<string>;
}
