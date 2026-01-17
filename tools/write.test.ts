import { test, expect, afterEach } from "bun:test";
import { writeTool } from "./write";
import { unlink } from "node:fs/promises";

const TEST_FILE = "test-write-output.tmp";

afterEach(async () => {
  try {
    await unlink(TEST_FILE);
  } catch {
    // File may not exist, ignore
  }
});

test("write tool has correct definition", () => {
  expect(writeTool.definition.name).toBe("write_file");
  expect(writeTool.definition.inputSchema.required).toContain("path");
  expect(writeTool.definition.inputSchema.required).toContain("content");
});

test("write tool creates a new file", async () => {
  const content = "Hello, world!\nLine 2\nLine 3";
  const result = await writeTool.execute({ path: TEST_FILE, content });

  expect(result).toContain("Successfully wrote");
  expect(result).toContain("3 lines");

  const file = Bun.file(TEST_FILE);
  expect(await file.exists()).toBe(true);
  expect(await file.text()).toBe(content);
});

test("write tool overwrites existing file", async () => {
  await Bun.write(TEST_FILE, "original content");

  const newContent = "new content";
  const result = await writeTool.execute({ path: TEST_FILE, content: newContent });

  expect(result).toContain("Successfully wrote");
  expect(await Bun.file(TEST_FILE).text()).toBe(newContent);
});
