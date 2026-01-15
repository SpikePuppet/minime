import pino from "pino";
import { loadSettings, type LogLevel } from "./settings";

let logger: pino.Logger | null = null;

export async function initLogger(): Promise<pino.Logger> {
  if (logger) return logger;

  const settings = await loadSettings();

  logger = pino({
    level: settings.logLevel,
    transport: {
      target: "pino/file",
      options: { destination: 1 }, // stdout
    },
  });

  return logger;
}

export function getLogger(): pino.Logger {
  if (!logger) {
    throw new Error("Logger not initialized. Call initLogger() first.");
  }
  return logger;
}
