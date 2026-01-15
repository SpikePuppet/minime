import React, { useState } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./Header";
import { ChatBox } from "./ChatBox";
import { InputBox } from "./InputBox";
import { chat, type Message } from "../llm";
import { getLogger } from "../logger";

interface AppProps {
  userName: string;
  mouseScrolling: boolean;
}

export function App({ userName, mouseScrolling }: AppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const { exit } = useApp();
  const { stdout } = useStdout();
  const height = stdout?.rows ?? 24;

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      exit();
    }
  });

  const handleCommand = (cmd: string): boolean => {
    const [command, ...args] = cmd.slice(1).split(" ");

    switch (command) {
      case "fill": {
        const count = parseInt(args[0] ?? "30", 10);
        const testMessages: Message[] = [];
        for (let i = 1; i <= count; i++) {
          testMessages.push({ role: "user", content: `Test message ${i}` });
          testMessages.push({ role: "assistant", content: `Response to test message ${i}. This is some sample text to help test scrolling functionality.` });
        }
        setMessages(testMessages);
        return true;
      }
      case "clear": {
        setMessages([]);
        return true;
      }
      default:
        return false;
    }
  };

  const handleSubmit = async (input: string) => {
    if (input === "exit" || input === "quit") {
      exit();
      return;
    }

    // Handle ! commands
    if (input.startsWith("!")) {
      if (handleCommand(input)) return;
      // Unknown command, treat as regular message
    }

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const response = await chat(newMessages);
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (err) {
      const log = getLogger();
      log.error({ err }, "Chat request failed");
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error: Failed to get response" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" height={height}>
      <Header userName={userName} />
      <Box borderStyle="double" borderColor="cyan" borderTop={false} borderLeft={false} borderRight={false} />
      <ChatBox messages={messages} isThinking={isThinking} userName={userName} mouseScrolling={mouseScrolling} />
      <Box borderStyle="double" borderColor="cyan" borderBottom={false} borderLeft={false} borderRight={false} />
      <InputBox onSubmit={handleSubmit} disabled={isThinking} />
    </Box>
  );
}
