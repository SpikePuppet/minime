import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface Command {
  name: string;
  description: string;
  command: string;
}

const commands: Command[] = [
  { name: "Fill History", description: "Add test messages to history", command: "!fill" },
  { name: "Fill (Custom)", description: "Add N test messages", command: "!fill 50" },
  { name: "Clear History", description: "Clear all messages", command: "!clear" },
  { name: "Exit", description: "Quit the application", command: "exit" },
];

interface CommandOverlayProps {
  onSelect: (command: string) => void;
  onClose: () => void;
}

export function CommandOverlay({ onSelect, onClose }: CommandOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape || input === "f1" || (key.ctrl && input === "c")) {
      onClose();
    } else if (key.upArrow) {
      setSelectedIndex((i) => (i > 0 ? i - 1 : commands.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => (i < commands.length - 1 ? i + 1 : 0));
    } else if (key.return) {
      onSelect(commands[selectedIndex].command);
      onClose();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">⚡ Admin Commands</Text>
        <Text color="gray">  (↑↓ navigate, Enter select, Esc close)</Text>
      </Box>

      {commands.map((cmd, i) => (
        <Box key={cmd.command}>
          <Text color={i === selectedIndex ? "cyan" : "white"}>
            {i === selectedIndex ? "▸ " : "  "}
            <Text bold={i === selectedIndex}>{cmd.name}</Text>
            <Text color="gray"> - {cmd.description}</Text>
            <Text color="magenta"> [{cmd.command}]</Text>
          </Text>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text color="gray">Press F1 or Esc to close</Text>
      </Box>
    </Box>
  );
}
