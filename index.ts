async function agentLoop() {
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
