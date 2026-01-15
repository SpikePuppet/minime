import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

// Regex to match mouse escape sequences (SGR mode)
const MOUSE_SEQUENCE_REGEX = /\x1b\[<\d+;\d+;\d+[Mm]/g;

interface InputBoxProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  history: string[];
}

export function InputBox({ onSubmit, disabled, history }: InputBoxProps) {
  const [value, setValue] = useState("");
  const [arrowVisible, setArrowVisible] = useState(true);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedValue, setSavedValue] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setArrowVisible((v) => !v);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Reset history index when history changes (new item added)
  useEffect(() => {
    setHistoryIndex(-1);
  }, [history.length]);

  useInput((input, key) => {
    if (disabled) return;

    if (key.upArrow && history.length > 0) {
      if (historyIndex === -1) {
        // Save current input before navigating history
        setSavedValue(value);
      }
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setValue(history[newIndex]);
    } else if (key.downArrow) {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setValue(history[newIndex]);
      } else if (historyIndex === 0) {
        // Return to saved input
        setHistoryIndex(-1);
        setValue(savedValue);
      }
    }
  });

  const handleChange = (newValue: string) => {
    // Filter out mouse escape sequences
    const filtered = newValue.replace(MOUSE_SEQUENCE_REGEX, "");
    if (filtered !== value) {
      setValue(filtered);
      // Reset history navigation when typing
      if (historyIndex !== -1) {
        setHistoryIndex(-1);
      }
    }
  };

  const handleSubmit = (input: string) => {
    const filtered = input.replace(MOUSE_SEQUENCE_REGEX, "").trim();
    if (filtered && !disabled) {
      onSubmit(filtered);
      setValue("");
      setHistoryIndex(-1);
      setSavedValue("");
    }
  };

  return (
    <Box paddingX={1}>
      <Text color="cyan">{arrowVisible ? ">" : " "} </Text>
      <TextInput
        value={value}
        onChange={handleChange}
        onSubmit={handleSubmit}
        placeholder={disabled ? "Waiting..." : "Type your message..."}
      />
    </Box>
  );
}
