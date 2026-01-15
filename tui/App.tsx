import React, { useState } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./Header";
import { ChatBox } from "./ChatBox";
import { InputBox } from "./InputBox";
import { chat, type Message } from "../llm";
import { getLogger } from "../logger";

interface AppProps {
  userName: string;
}

export function App({ userName }: AppProps) {
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

  const handleSubmit = async (input: string) => {
    if (input === "exit" || input === "quit") {
      exit();
      return;
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
      <ChatBox messages={messages} isThinking={isThinking} />
      <Box borderStyle="double" borderColor="cyan" borderBottom={false} borderLeft={false} borderRight={false} />
      <InputBox onSubmit={handleSubmit} disabled={isThinking} />
    </Box>
  );
}
