export interface Settings {
  provider: "anthropic" | "openai";
  apiKeys: {
    anthropic: string;
    openai: string;
  };
}

const SETTINGS_PATH = "./settings.json";

export async function loadSettings(): Promise<Settings> {
  const file = Bun.file(SETTINGS_PATH);
  return await file.json();
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
