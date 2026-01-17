import { test, expect } from "bun:test";
import { readTool } from "./read";

test("read tool has correct definition", () => {
  expect(readTool.definition.name).toBe("read_file");
  expect(readTool.definition.inputSchema.required).toContain("path");
});

test("read tool reads file contents with line numbers", async () => {
  const result = await readTool.execute({ path: "package.json" });
  expect(result).toContain("1:");
  expect(result).toContain("name");
});

test("read tool handles non-existent file", async () => {
  const result = await readTool.execute({ path: "nonexistent-file-xyz.txt" });
  expect(result).toContain("Error: File not found");
});

test("read tool respects startLine and endLine", async () => {
  const result = await readTool.execute({
    path: "package.json",
    startLine: 1,
    endLine: 3,
  });
  const lines = result.split("\n");
  expect(lines.length).toBe(3);
  expect(lines[0]).toStartWith("1:");
  expect(lines[2]).toStartWith("3:");
});

test("read tool handles startLine only", async () => {
  const result = await readTool.execute({
    path: "package.json",
    startLine: 2,
  });
  expect(result).toStartWith("2:");
});
