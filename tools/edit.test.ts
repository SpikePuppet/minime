import { test, expect, afterEach } from "bun:test";
import { editTool } from "./edit";
import { unlink } from "node:fs/promises";

const TEST_FILE = "test-edit-output.tmp";

afterEach(async () => {
  try {
    await unlink(TEST_FILE);
  } catch {
    // File may not exist, ignore
  }
});

test("edit tool has correct definition", () => {
  expect(editTool.definition.name).toBe("edit_file");
  expect(editTool.definition.inputSchema.required).toContain("path");
  expect(editTool.definition.inputSchema.required).toContain("old_string");
  expect(editTool.definition.inputSchema.required).toContain("new_string");
});

test("edit tool replaces text in file", async () => {
  await Bun.write(TEST_FILE, "Hello, world!");

  const result = await editTool.execute({
    path: TEST_FILE,
    old_string: "world",
    new_string: "Bun",
  });

  expect(result).toContain("Successfully edited");
  expect(await Bun.file(TEST_FILE).text()).toBe("Hello, Bun!");
});

test("edit tool handles non-existent file", async () => {
  const result = await editTool.execute({
    path: "nonexistent-file-xyz.txt",
    old_string: "foo",
    new_string: "bar",
  });

  expect(result).toContain("Error: File not found");
});

test("edit tool handles text not found", async () => {
  await Bun.write(TEST_FILE, "Hello, world!");

  const result = await editTool.execute({
    path: TEST_FILE,
    old_string: "goodbye",
    new_string: "hello",
  });

  expect(result).toContain("Could not find the specified text");
});

test("edit tool rejects ambiguous matches", async () => {
  await Bun.write(TEST_FILE, "foo bar foo baz");

  const result = await editTool.execute({
    path: TEST_FILE,
    old_string: "foo",
    new_string: "qux",
  });

  expect(result).toContain("Found 2 occurrences");
  // File should be unchanged
  expect(await Bun.file(TEST_FILE).text()).toBe("foo bar foo baz");
});

test("edit tool preserves whitespace", async () => {
  const content = "function test() {\n  const x = 1;\n}";
  await Bun.write(TEST_FILE, content);

  const result = await editTool.execute({
    path: TEST_FILE,
    old_string: "  const x = 1;",
    new_string: "  const x = 2;",
  });

  expect(result).toContain("Successfully edited");
  expect(await Bun.file(TEST_FILE).text()).toBe("function test() {\n  const x = 2;\n}");
});
