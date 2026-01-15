import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box justifyContent="space-between" paddingX={1}>
      <Text>👋 Hello, {userName}!</Text>
      <Text>{time}</Text>
    </Box>
  );
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
