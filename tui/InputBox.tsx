import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface InputBoxProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function InputBox({ onSubmit, disabled }: InputBoxProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (input: string) => {
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setValue("");
    }
  };

  return (
    <Box paddingX={1}>
      <Text color="cyan">&gt; </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={disabled ? "Waiting..." : "Type your message..."}
      />
    </Box>
  );
}
