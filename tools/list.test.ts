import { test, expect } from "bun:test";
import { listTool } from "./list";

test("list tool has correct definition", () => {
  expect(listTool.definition.name).toBe("list_files");
  expect(listTool.definition.inputSchema.required).toEqual([]);
});

test("list tool lists current directory", async () => {
  const result = await listTool.execute({});

  expect(result).toContain("package.json");
  expect(result).toContain("tools");
});

test("list tool lists specific directory", async () => {
  const result = await listTool.execute({ path: "tools" });

  expect(result).toContain("grep.ts");
  expect(result).toContain("read.ts");
});

test("list tool handles non-existent directory", async () => {
  const result = await listTool.execute({ path: "nonexistent-dir-xyz" });

  expect(result).toContain("Error");
});

test("list tool supports recursive listing", async () => {
  const result = await listTool.execute({ path: "tools", recursive: true });

  expect(result).toContain("tools/grep.ts");
  expect(result).toContain("tools/read.ts");
});

test("list tool respects maxDepth", async () => {
  const result = await listTool.execute({
    path: ".",
    recursive: true,
    maxDepth: 1,
  });

  // Should include top-level items but not deep nested ones
  expect(result).toContain("tools");
  expect(result).not.toContain("node_modules/bun-types");
});
