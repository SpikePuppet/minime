import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdout, useStdin } from "ink";
import { ToolCallBlock } from "./ToolCallBlock";
import type { ExtendedMessage, MessageContent, ToolResult } from "../tools/types";

const thinkingFrames = ["🤔", "🧠", "💭", "✨", "💡", "🔮", "⚡", "🌟"];

// Mouse tracking escape sequences
const ENABLE_MOUSE = "\x1b[?1000h\x1b[?1006h"; // Enable mouse tracking (SGR mode)
const DISABLE_MOUSE = "\x1b[?1000l\x1b[?1006l"; // Disable mouse tracking

interface ChatBoxProps {
  messages: ExtendedMessage[];
  isThinking: boolean;
  userName: string;
  mouseScrolling: boolean;
  toolResults?: Map<string, ToolResult>;
}

export function ChatBox({ messages, isThinking, userName, mouseScrolling, toolResults }: ChatBoxProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const { stdout } = useStdout();
  const { stdin } = useStdin();

  // Reserve space for header (3 lines) + input (3 lines) + borders + spacing
  const visibleHeight = Math.floor(((stdout?.rows ?? 24) - 8) / 2); // Divide by 2 for spacing

  // Enable/disable mouse tracking
  useEffect(() => {
    if (!mouseScrolling) return;

    process.stdout.write(ENABLE_MOUSE);

    return () => {
      process.stdout.write(DISABLE_MOUSE);
    };
  }, [mouseScrolling]);

  // Handle mouse wheel events
  useEffect(() => {
    if (!mouseScrolling || !stdin) return;

    const handleData = (data: Buffer) => {
      const str = data.toString();

      // SGR mouse wheel: \x1b[<64;x;yM (scroll up) or \x1b[<65;x;yM (scroll down)
      if (str.includes("\x1b[<64;")) {
        // Scroll up
        setScrollOffset((prev) => Math.max(0, prev - 1));
      } else if (str.includes("\x1b[<65;")) {
        // Scroll down
        setScrollOffset((prev) => Math.min(Math.max(0, messages.length - visibleHeight), prev + 1));
      }
    };

    stdin.on("data", handleData);
    return () => {
      stdin.off("data", handleData);
    };
  }, [mouseScrolling, stdin, messages.length, visibleHeight]);

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
      setScrollOffset((prev) => Math.min(Math.max(0, messages.length - visibleHeight), prev + 1));
    } else if (key.pageUp) {
      setScrollOffset((prev) => Math.max(0, prev - visibleHeight));
    } else if (key.pageDown) {
      setScrollOffset((prev) => Math.min(Math.max(0, messages.length - visibleHeight), prev + visibleHeight));
    }
  });

  const visibleMessages = messages.slice(scrollOffset, scrollOffset + visibleHeight);
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset + visibleHeight < messages.length;

  const renderMessageContent = (msg: ExtendedMessage, msgIndex: number) => {
    if (typeof msg.content === "string") {
      // Simple string content
      if (msg.role === "user") {
        return (
          <Text>
            <Text color="cyan" bold>{userName}: </Text>
            {msg.content}
          </Text>
        );
      } else {
        return (
          <Text>
            <Text color="green" bold>🤖 Assistant: </Text>
            {msg.content}
          </Text>
        );
      }
    }

    // Array content with potential tool calls
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < msg.content.length; i++) {
      const block = msg.content[i];
      if (!block) continue;

      if (block.type === "text") {
        const textBlock = block;
        if (msg.role === "user") {
          elements.push(
            <Box key={`${msgIndex}-text-${i}`}>
              <Text>
                <Text color="cyan" bold>{userName}: </Text>
                {textBlock.text}
              </Text>
            </Box>
          );
        } else {
          elements.push(
            <Box key={`${msgIndex}-text-${i}`}>
              <Text>
                <Text color="green" bold>🤖 Assistant: </Text>
                {textBlock.text}
              </Text>
            </Box>
          );
        }
      } else if (block.type === "tool_use") {
        const toolUseBlock = block;
        const result = toolResults?.get(toolUseBlock.toolCall.id);
        elements.push(
          <Box key={`${msgIndex}-tool-${i}`}>
            <ToolCallBlock
              toolCall={toolUseBlock.toolCall}
              result={result}
            />
          </Box>
        );
      }
      // Skip tool_result blocks - they're shown via ToolCallBlock
    }

    return <>{elements}</>;
  };

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
      {canScrollUp && (
        <Text color="gray">↑ More messages above</Text>
      )}
      {visibleMessages.map((msg, i) => (
        <Box key={scrollOffset + i} flexDirection="column" marginBottom={1}>
          {renderMessageContent(msg, scrollOffset + i)}
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
