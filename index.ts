import { loadSettings, getApiKey } from "./settings";
import { initLogger, getLogger } from "./logger";
import { chat, type Message } from "./llm";
import { startSpinner, stopSpinner } from "./spinner";

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

  const messages: Message[] = [];
  const prompt = "> ";
  process.stdout.write(prompt);

  for await (const line of console) {
    const input = line.trim();

    if (input === "exit" || input === "quit") {
      log.info("Agent shutting down");
      break;
    }

    if (!input) {
      process.stdout.write(prompt);
      continue;
    }

    log.debug({ input }, "User input received");

    messages.push({ role: "user", content: input });

    try {
      startSpinner("Thinking");
      const response = await chat(messages);
      stopSpinner();
      messages.push({ role: "assistant", content: response });
      console.log(`${response}\n`);
    } catch (err) {
      stopSpinner();
      log.error({ err }, "Chat request failed");
      console.log("Error: Failed to get response\n");
      messages.pop(); // Remove failed user message
    }

    process.stdout.write(prompt);
  }
}

agentLoop();
