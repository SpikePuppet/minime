import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

// Regex to match mouse escape sequences (SGR mode)
const MOUSE_SEQUENCE_REGEX = /\x1b\[<\d+;\d+;\d+[Mm]/g;

interface InputBoxProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function InputBox({ onSubmit, disabled }: InputBoxProps) {
  const [value, setValue] = useState("");

  const handleChange = (newValue: string) => {
    // Filter out mouse escape sequences
    const filtered = newValue.replace(MOUSE_SEQUENCE_REGEX, "");
    if (filtered !== value) {
      setValue(filtered);
    }
  };

  const handleSubmit = (input: string) => {
    const filtered = input.replace(MOUSE_SEQUENCE_REGEX, "").trim();
    if (filtered && !disabled) {
      onSubmit(filtered);
      setValue("");
    }
  };

  return (
    <Box paddingX={1}>
      <Text color="cyan">&gt; </Text>
      <TextInput
        value={value}
        onChange={handleChange}
        onSubmit={handleSubmit}
        placeholder={disabled ? "Waiting..." : "Type your message..."}
      />
    </Box>
  );
}
