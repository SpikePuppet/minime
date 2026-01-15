export type Provider = "anthropic" | "openai";
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface Settings {
  provider: Provider;
  apiKeys: {
    anthropic: string;
    openai: string;
  };
  logLevel: LogLevel;
}

const SETTINGS_PATH = "./settings.json";

export async function loadSettings(): Promise<Settings> {
  const file = Bun.file(SETTINGS_PATH);
  const settings = (await file.json()) as Settings;
  return settings;
}

export async function getApiKey(): Promise<string> {
  const settings = await loadSettings();
  const key = settings.apiKeys[settings.provider];
  if (!key) {
    throw new Error(`No API key configured for provider: ${settings.provider}`);
  }
  return key;
}

export async function getProvider(): Promise<string> {
  const settings = await loadSettings();
  return settings.provider;
}
