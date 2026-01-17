import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { loadSettings, getApiKey, type Provider } from "./settings";
import { getLogger } from "./logger";
import { toolRegistry } from "./tools/registry";
import type {
  ExtendedMessage,
  ChatResponse,
  ToolCall,
  ToolDefinition,
  MessageContent,
} from "./tools/types";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function chat(messages: Message[]): Promise<string> {
  const settings = await loadSettings();
  const apiKey = await getApiKey();
  const log = getLogger();

  log.debug({ provider: settings.provider, messageCount: messages.length }, "Sending chat request");

  if (settings.provider === "anthropic") {
    return chatAnthropic(apiKey, messages, settings.model);
  } else if (settings.provider === "openai") {
    return chatOpenAI(apiKey, messages, settings.model);
  } else {
    return chatOpenRouter(apiKey, messages, settings.model);
  }
}

export async function chatWithTools(
  messages: ExtendedMessage[],
  options?: { enableTools?: boolean }
): Promise<ChatResponse> {
  const settings = await loadSettings();
  const apiKey = await getApiKey();
  const log = getLogger();
  const enableTools = options?.enableTools ?? true;

  log.debug(
    { provider: settings.provider, messageCount: messages.length, enableTools },
    "Sending chat request with tools"
  );

  const tools = enableTools ? toolRegistry.getDefinitions() : [];

  if (settings.provider === "anthropic") {
    return chatAnthropicWithTools(apiKey, messages, tools, settings.model);
  } else if (settings.provider === "openai") {
    return chatOpenAIWithTools(apiKey, messages, tools, settings.model);
  } else {
    return chatOpenRouterWithTools(apiKey, messages, tools, settings.model);
  }
}

async function chatAnthropic(apiKey: string, messages: Message[], model?: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const log = getLogger();

  const response = await client.messages.create({
    model: model ?? "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock?.type === "text" ? textBlock.text : "";

  log.debug({ tokens: response.usage }, "Anthropic response received");

  return text;
}

function convertToAnthropicMessages(
  messages: ExtendedMessage[]
): Anthropic.MessageParam[] {
  return messages.map((msg) => {
    if (typeof msg.content === "string") {
      return { role: msg.role, content: msg.content };
    }

    const contentBlocks: Anthropic.ContentBlockParam[] = msg.content.map((block) => {
      if (block.type === "text") {
        return { type: "text" as const, text: block.text };
      } else if (block.type === "tool_use") {
        return {
          type: "tool_use" as const,
          id: block.toolCall.id,
          name: block.toolCall.name,
          input: block.toolCall.input,
        };
      } else {
        return {
          type: "tool_result" as const,
          tool_use_id: block.toolResult.toolUseId,
          content: block.toolResult.content,
          is_error: block.toolResult.isError,
        };
      }
    });

    return { role: msg.role, content: contentBlocks };
  });
}

function convertToAnthropicTools(tools: ToolDefinition[]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool["input_schema"],
  }));
}

async function chatAnthropicWithTools(
  apiKey: string,
  messages: ExtendedMessage[],
  tools: ToolDefinition[],
  model?: string
): Promise<ChatResponse> {
  const client = new Anthropic({ apiKey });
  const log = getLogger();

  const anthropicMessages = convertToAnthropicMessages(messages);
  const anthropicTools = convertToAnthropicTools(tools);

  const response = await client.messages.create({
    model: model ?? "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: anthropicMessages,
    tools: anthropicTools.length > 0 ? anthropicTools : undefined,
  });

  log.debug({ tokens: response.usage, stopReason: response.stop_reason }, "Anthropic response received");

  const textBlocks = response.content.filter((block) => block.type === "text");
  const content = textBlocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");

  const toolCalls: ToolCall[] = response.content
    .filter((block) => block.type === "tool_use")
    .map((block) => {
      if (block.type !== "tool_use") throw new Error("Unexpected block type");
      return {
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      };
    });

  let stopReason: ChatResponse["stopReason"] = "end_turn";
  if (response.stop_reason === "tool_use") {
    stopReason = "tool_use";
  } else if (response.stop_reason === "max_tokens") {
    stopReason = "max_tokens";
  }

  return { content, toolCalls, stopReason };
}

async function chatOpenAI(apiKey: string, messages: Message[], model?: string): Promise<string> {
  const client = new OpenAI({ apiKey });
  const log = getLogger();

  const response = await client.chat.completions.create({
    model: model ?? "gpt-4o",
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const text = response.choices[0]?.message?.content ?? "";

  log.debug({ tokens: response.usage }, "OpenAI response received");

  return text;
}

function convertToOpenAIMessages(
  messages: ExtendedMessage[]
): OpenAI.ChatCompletionMessageParam[] {
  const result: OpenAI.ChatCompletionMessageParam[] = [];

  for (const msg of messages) {
    if (typeof msg.content === "string") {
      result.push({ role: msg.role, content: msg.content });
      continue;
    }

    if (msg.role === "assistant") {
      const textParts = msg.content.filter((c) => c.type === "text");
      const toolUseParts = msg.content.filter((c) => c.type === "tool_use");

      const content = textParts.map((c) => (c.type === "text" ? c.text : "")).join("\n") || null;

      const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = toolUseParts.map((c) => {
        if (c.type !== "tool_use") throw new Error("Unexpected content type");
        return {
          id: c.toolCall.id,
          type: "function" as const,
          function: {
            name: c.toolCall.name,
            arguments: JSON.stringify(c.toolCall.input),
          },
        };
      });

      result.push({
        role: "assistant",
        content,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      });
    } else {
      // User message - could contain tool results
      const toolResults = msg.content.filter((c) => c.type === "tool_result");
      const textParts = msg.content.filter((c) => c.type === "text");

      // Add tool results as separate messages
      for (const tr of toolResults) {
        if (tr.type !== "tool_result") continue;
        result.push({
          role: "tool",
          tool_call_id: tr.toolResult.toolUseId,
          content: tr.toolResult.content,
        });
      }

      // Add any text content as user message
      if (textParts.length > 0) {
        const text = textParts.map((c) => (c.type === "text" ? c.text : "")).join("\n");
        if (text) {
          result.push({ role: "user", content: text });
        }
      }
    }
  }

  return result;
}

function convertToOpenAITools(
  tools: ToolDefinition[]
): OpenAI.ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

async function chatOpenAIWithTools(
  apiKey: string,
  messages: ExtendedMessage[],
  tools: ToolDefinition[],
  model?: string
): Promise<ChatResponse> {
  const client = new OpenAI({ apiKey });
  const log = getLogger();

  const openaiMessages = convertToOpenAIMessages(messages);
  const openaiTools = convertToOpenAITools(tools);

  const response = await client.chat.completions.create({
    model: model ?? "gpt-4o",
    max_tokens: 4096,
    messages: openaiMessages,
    tools: openaiTools.length > 0 ? openaiTools : undefined,
  });

  log.debug({ tokens: response.usage, finishReason: response.choices[0]?.finish_reason }, "OpenAI response received");

  const choice = response.choices[0];
  const content = choice?.message?.content ?? "";

  const toolCalls: ToolCall[] = (choice?.message?.tool_calls ?? [])
    .filter((tc): tc is OpenAI.ChatCompletionMessageToolCall & { type: "function" } => tc.type === "function")
    .map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));

  let stopReason: ChatResponse["stopReason"] = "end_turn";
  if (choice?.finish_reason === "tool_calls") {
    stopReason = "tool_use";
  } else if (choice?.finish_reason === "length") {
    stopReason = "max_tokens";
  }

  return { content, toolCalls, stopReason };
}

async function chatOpenRouter(apiKey: string, messages: Message[], model?: string): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const log = getLogger();

  const response = await client.chat.completions.create({
    model: model ?? "anthropic/claude-sonnet-4",
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const text = response.choices[0]?.message?.content ?? "";

  log.debug({ tokens: response.usage }, "OpenRouter response received");

  return text;
}

async function chatOpenRouterWithTools(
  apiKey: string,
  messages: ExtendedMessage[],
  tools: ToolDefinition[],
  model?: string
): Promise<ChatResponse> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const log = getLogger();

  const openaiMessages = convertToOpenAIMessages(messages);
  const openaiTools = convertToOpenAITools(tools);

  const response = await client.chat.completions.create({
    model: model ?? "anthropic/claude-sonnet-4",
    max_tokens: 4096,
    messages: openaiMessages,
    tools: openaiTools.length > 0 ? openaiTools : undefined,
  });

  log.debug({ tokens: response.usage, finishReason: response.choices[0]?.finish_reason }, "OpenRouter response received");

  const choice = response.choices[0];
  const content = choice?.message?.content ?? "";

  const toolCalls: ToolCall[] = (choice?.message?.tool_calls ?? [])
    .filter((tc): tc is OpenAI.ChatCompletionMessageToolCall & { type: "function" } => tc.type === "function")
    .map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));

  let stopReason: ChatResponse["stopReason"] = "end_turn";
  if (choice?.finish_reason === "tool_calls") {
    stopReason = "tool_use";
  } else if (choice?.finish_reason === "length") {
    stopReason = "max_tokens";
  }

  return { content, toolCalls, stopReason };
}
