import React, { useState } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./Header";
import { ChatBox } from "./ChatBox";
import { InputBox } from "./InputBox";
import { CommandOverlay } from "./CommandOverlay";
import { HistoryOverlay } from "./HistoryOverlay";
import { chatWithTools, type Message } from "../llm";
import { toolRegistry } from "../tools/registry";
import type { ExtendedMessage, ToolResult, MessageContent } from "../tools/types";
import { getLogger } from "../logger";

interface AppProps {
  userName: string;
  mouseScrolling: boolean;
  historySize: number;
}

export function App({ userName, mouseScrolling, historySize }: AppProps) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [toolResults, setToolResults] = useState<Map<string, ToolResult>>(new Map());
  const [isThinking, setIsThinking] = useState(false);
  const [showCommandOverlay, setShowCommandOverlay] = useState(false);
  const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const { exit } = useApp();
  const { stdout } = useStdout();
  const height = stdout?.rows ?? 24;

  useInput((input, key) => {
    if (showCommandOverlay || showHistoryOverlay) return; // Let overlay handle input

    if (key.escape || (key.ctrl && input === "c")) {
      exit();
    }
  });

  const handleCommand = (cmd: string): boolean => {
    const [command, ...args] = cmd.slice(1).split(" ");

    switch (command) {
      case "fill": {
        const count = parseInt(args[0] ?? "30", 10);
        const testMessages: ExtendedMessage[] = [];
        for (let i = 1; i <= count; i++) {
          testMessages.push({ role: "user", content: `Test message ${i}` });
          testMessages.push({ role: "assistant", content: `Response to test message ${i}. This is some sample text to help test scrolling functionality.` });
        }
        setMessages(testMessages);
        return true;
      }
      case "clear": {
        setMessages([]);
        setToolResults(new Map());
        return true;
      }
      default:
        return false;
    }
  };

  const addToHistory = (input: string) => {
    setInputHistory((prev) => {
      const newHistory = [input, ...prev.filter((h) => h !== input)];
      return newHistory.slice(0, historySize);
    });
  };

  const handleSubmit = async (input: string) => {
    addToHistory(input);

    if (input === "exit" || input === "quit") {
      exit();
      return;
    }

    // Handle # commands (UI commands)
    if (input === "#commands") {
      setShowCommandOverlay(true);
      return;
    }
    if (input === "#history") {
      setShowHistoryOverlay(true);
      return;
    }

    // Handle ! commands (admin commands)
    if (input.startsWith("!")) {
      if (handleCommand(input)) return;
      // Unknown command, treat as regular message
    }

    let currentMessages: ExtendedMessage[] = [...messages, { role: "user", content: input }];
    setMessages(currentMessages);
    setIsThinking(true);

    const log = getLogger();

    try {
      let response = await chatWithTools(currentMessages, { enableTools: true });

      // Loop while model wants to use tools (max 10 iterations)
      let iterations = 0;
      while (response.stopReason === "tool_use" && iterations++ < 10) {
        log.debug({ iteration: iterations, toolCalls: response.toolCalls.length }, "Processing tool calls");

        // Build assistant message with tool calls
        const assistantContent: MessageContent[] = [];
        if (response.content) {
          assistantContent.push({ type: "text", text: response.content });
        }
        for (const tc of response.toolCalls) {
          assistantContent.push({ type: "tool_use", toolCall: tc });
        }
        currentMessages = [...currentMessages, { role: "assistant", content: assistantContent }];

        // Execute tools and collect results
        const toolResultsContent: MessageContent[] = [];
        const newToolResults = new Map(toolResults);

        for (const tc of response.toolCalls) {
          log.debug({ tool: tc.name, input: tc.input }, "Executing tool");
          const result = await toolRegistry.execute(tc);
          toolResultsContent.push({ type: "tool_result", toolResult: result });
          newToolResults.set(tc.id, result);
          log.debug({ tool: tc.name, isError: result.isError }, "Tool execution complete");
        }

        setToolResults(newToolResults);
        currentMessages = [...currentMessages, { role: "user", content: toolResultsContent }];
        setMessages(currentMessages);

        // Get next response
        response = await chatWithTools(currentMessages, { enableTools: true });
      }

      // Add final text response
      if (response.content) {
        setMessages([...currentMessages, { role: "assistant", content: response.content }]);
      }
    } catch (err) {
      log.error({ err }, "Chat request failed");
      setMessages([
        ...currentMessages,
        { role: "assistant", content: "Error: Failed to get response" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleOverlaySelect = (command: string) => {
    handleSubmit(command);
  };

  if (showCommandOverlay) {
    return (
      <Box flexDirection="column" justifyContent="center" alignItems="center" height={height}>
        <CommandOverlay
          onSelect={handleOverlaySelect}
          onClose={() => setShowCommandOverlay(false)}
        />
      </Box>
    );
  }

  if (showHistoryOverlay) {
    return (
      <Box flexDirection="column" justifyContent="center" alignItems="center" height={height}>
        <HistoryOverlay
          history={inputHistory}
          onSelect={handleOverlaySelect}
          onClose={() => setShowHistoryOverlay(false)}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" height={height}>
      <Header userName={userName} />
      <Box borderStyle="double" borderColor="cyan" borderTop={false} borderLeft={false} borderRight={false} />
      <ChatBox
        messages={messages}
        isThinking={isThinking}
        userName={userName}
        mouseScrolling={mouseScrolling}
        toolResults={toolResults}
      />
      <Box borderStyle="double" borderColor="cyan" borderBottom={false} borderLeft={false} borderRight={false} />
      <InputBox onSubmit={handleSubmit} disabled={isThinking} history={inputHistory} />
    </Box>
  );
}
