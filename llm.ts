import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { loadSettings, getApiKey, type Provider } from "./settings";
import { getLogger } from "./logger";

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
