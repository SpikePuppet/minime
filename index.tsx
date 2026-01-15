import React from "react";
import { render } from "ink";
import { loadSettings } from "./settings";
import { initLogger } from "./logger";
import { App } from "./tui/App";

async function main() {
  const settings = await loadSettings();
  await initLogger();

  render(<App userName={settings.userName} mouseScrolling={settings.mouseScrolling ?? false} historySize={settings.historySize ?? 10} />, { fullscreen: true });
}

main();
