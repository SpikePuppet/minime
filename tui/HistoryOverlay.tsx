import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface HistoryOverlayProps {
  history: string[];
  onSelect: (command: string) => void;
  onClose: () => void;
}

export function HistoryOverlay({ history, onSelect, onClose }: HistoryOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onClose();
    } else if (key.upArrow) {
      setSelectedIndex((i) => (i > 0 ? i - 1 : history.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => (i < history.length - 1 ? i + 1 : 0));
    } else if (key.return && history.length > 0) {
      onSelect(history[selectedIndex]);
      onClose();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="magenta"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="magenta">📜 Input History</Text>
        <Text color="gray">  (↑↓ navigate, Enter select, Esc close)</Text>
      </Box>

      {history.length === 0 ? (
        <Text color="gray">No history yet</Text>
      ) : (
        history.map((item, i) => (
          <Box key={i}>
            <Text color={i === selectedIndex ? "cyan" : "white"}>
              {i === selectedIndex ? "▸ " : "  "}
              <Text bold={i === selectedIndex}>{item}</Text>
            </Text>
          </Box>
        ))
      )}

      <Box marginTop={1}>
        <Text color="gray">Press Esc to close</Text>
      </Box>
    </Box>
  );
}
