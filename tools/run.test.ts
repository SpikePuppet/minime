import { test, expect } from "bun:test";
import { runTool } from "./run";

test("run tool has correct definition", () => {
  expect(runTool.definition.name).toBe("run_command");
  expect(runTool.definition.inputSchema.required).toContain("command");
});

test("run tool executes simple command", async () => {
  const result = await runTool.execute({ command: "echo hello" });

  expect(result).toBe("hello");
});

test("run tool captures stdout", async () => {
  const result = await runTool.execute({ command: "echo 'line1' && echo 'line2'" });

  expect(result).toContain("line1");
  expect(result).toContain("line2");
});

test("run tool captures stderr", async () => {
  const result = await runTool.execute({ command: "echo error >&2" });

  expect(result).toContain("stderr:");
  expect(result).toContain("error");
});

test("run tool reports exit code on failure", async () => {
  const result = await runTool.execute({ command: "exit 1" });

  expect(result).toContain("Exit code: 1");
});

test("run tool respects cwd", async () => {
  const result = await runTool.execute({ command: "pwd", cwd: "/tmp" });

  expect(result).toContain("/tmp");
});

test("run tool handles command not found", async () => {
  const result = await runTool.execute({ command: "nonexistentcommand123456" });

  expect(result).toContain("not found");
});

test("run tool handles no output", async () => {
  const result = await runTool.execute({ command: "true" });

  expect(result).toBe("(no output)");
});
