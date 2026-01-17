import { test, expect } from "bun:test";
import { grepTool } from "./grep";

test("grep tool has correct definition", () => {
  expect(grepTool.definition.name).toBe("grep");
  expect(grepTool.definition.inputSchema.required).toContain("pattern");
});

test("grep tool executes and returns results", async () => {
  const result = await grepTool.execute({ pattern: "useState", path: "." });
  expect(result).toContain("useState");
});

test("grep tool handles no matches gracefully", async () => {
  // Search in tui directory which won't contain this unique pattern
  const result = await grepTool.execute({ pattern: "xyznonexistent987654321pattern", path: "./tui" });
  expect(result).toBe("No matches found.");
});

test("grep tool respects maxResults", async () => {
  const result = await grepTool.execute({ pattern: "import", maxResults: 3 });
  const lines = result.split("\n").filter((l) => l.trim());
  expect(lines.length).toBeLessThanOrEqual(3);
});
