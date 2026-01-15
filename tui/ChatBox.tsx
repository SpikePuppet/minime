import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import type { Message } from "../llm";

const thinkingFrames = ["🤔", "🧠", "💭", "✨", "💡", "🔮", "⚡", "🌟"];

interface ChatBoxProps {
  messages: Message[];
  isThinking: boolean;
}

export function ChatBox({ messages, isThinking }: ChatBoxProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isThinking) return;
    const timer = setInterval(() => {
      setFrameIndex((i) => (i + 1) % thinkingFrames.length);
    }, 200);
    return () => clearInterval(timer);
  }, [isThinking]);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
      {messages.map((msg, i) => (
        <Box key={i} marginY={0}>
          {msg.role === "user" ? (
            <Text>
              <Text color="cyan" bold>You: </Text>
              {msg.content}
            </Text>
          ) : (
            <Text>
              <Text color="green" bold>🤖 Assistant: </Text>
              {msg.content}
            </Text>
          )}
        </Box>
      ))}
      {isThinking && (
        <Text color="yellow">
          {thinkingFrames[frameIndex]}  Thinking...
        </Text>
      )}
    </Box>
  );
}
