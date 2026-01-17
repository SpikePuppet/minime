import React from "react";
import { Box, Text } from "ink";
import type { ToolCall, ToolResult } from "../tools/types";

interface ToolCallBlockProps {
  toolCall: ToolCall;
  result?: ToolResult;
}

export function ToolCallBlock({ toolCall, result }: ToolCallBlockProps) {
  const inputStr = JSON.stringify(toolCall.input, null, 2);
  const truncatedResult = result?.content
    ? result.content.length > 500
      ? result.content.slice(0, 500) + "..."
      : result.content
    : null;

  return (
    <Box flexDirection="column" marginY={1}>
      <Text>
        <Text color="magenta" bold>
          🔧 {toolCall.name}
        </Text>
      </Text>
      <Text color="yellow">{inputStr}</Text>
      {truncatedResult && (
        <Box marginTop={1}>
          <Text color={result?.isError ? "red" : "gray"}>{truncatedResult}</Text>
        </Box>
      )}
    </Box>
  );
}
