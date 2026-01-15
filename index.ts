import { loadSettings, getApiKey } from "./settings";
import { initLogger, getLogger } from "./logger";

async function agentLoop() {
  const settings = await loadSettings();
  await initLogger();
  const log = getLogger();

  log.info({ provider: settings.provider }, "Agent starting");

  try {
    await getApiKey();
    log.debug("API key configured");
  } catch {
    log.warn("API key not configured");
  }

  const prompt = "> ";
  process.stdout.write(prompt);

  for await (const line of console) {
    const input = line.trim();

    if (input === "exit" || input === "quit") {
      log.info("Agent shutting down");
      break;
    }

    log.debug({ input }, "User input received");

    // TODO: Send to LLM and get response
    console.log(`You said: ${input}`);

    process.stdout.write(prompt);
  }
}

agentLoop();
