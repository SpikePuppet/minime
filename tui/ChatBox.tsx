import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import type { Message } from "../llm";

const thinkingFrames = ["🤔", "🧠", "💭", "✨", "💡", "🔮", "⚡", "🌟"];

interface ChatBoxProps {
  messages: Message[];
  isThinking: boolean;
  userName: string;
}

export function ChatBox({ messages, isThinking, userName }: ChatBoxProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const { stdout } = useStdout();

  // Reserve space for header (3 lines) + input (3 lines) + borders
  const visibleHeight = (stdout?.rows ?? 24) - 8;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setScrollOffset(Math.max(0, messages.length - visibleHeight));
  }, [messages.length, visibleHeight]);

  useEffect(() => {
    if (!isThinking) return;
    const timer = setInterval(() => {
      setFrameIndex((i) => (i + 1) % thinkingFrames.length);
    }, 200);
    return () => clearInterval(timer);
  }, [isThinking]);

  useInput((input, key) => {
    if (key.upArrow || (key.shift && key.tab)) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setScrollOffset((prev) => Math.min(messages.length - 1, prev + 1));
    } else if (key.pageUp) {
      setScrollOffset((prev) => Math.max(0, prev - visibleHeight));
    } else if (key.pageDown) {
      setScrollOffset((prev) => Math.min(Math.max(0, messages.length - visibleHeight), prev + visibleHeight));
    }
  });

  const visibleMessages = messages.slice(scrollOffset, scrollOffset + visibleHeight);
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset + visibleHeight < messages.length;

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
      {canScrollUp && (
        <Text color="gray">↑ More messages above</Text>
      )}
      {visibleMessages.map((msg, i) => (
        <Box key={scrollOffset + i} marginY={0}>
          {msg.role === "user" ? (
            <Text>
              <Text color="cyan" bold>{userName}: </Text>
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
      {canScrollDown && (
        <Text color="gray">↓ More messages below</Text>
      )}
    </Box>
  );
}
