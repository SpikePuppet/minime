import { loadSettings, getApiKey } from "./settings";

async function agentLoop() {
  const settings = await loadSettings();
  console.log(`Current model provider: ${settings.provider}! 🚀`);

  try {
    await getApiKey();
    console.log("API key: configured");
  } catch {
    console.log("API key: not configured");
  }

  console.log();
  const prompt = "> ";
  process.stdout.write(prompt);

  for await (const line of console) {
    const input = line.trim();

    if (input === "exit" || input === "quit") {
      console.log("Goodbye!");
      break;
    }

    // TODO: Send to LLM and get response
    console.log(`You said: ${input}`);

    process.stdout.write(prompt);
  }
}

agentLoop();
