import { describe, expect, it } from "vitest";
import { parseDecision } from "./schemas/decision.schema";
import { isAllowed, DEFAULT_POLICY } from "./schemas/policy";
import { createTrace, addTraceEvent, addTraceArtifact } from "./schemas/trace.schema";
import { createCapsuleManifest, verifyCapsuleIntegrity } from "./schemas/capsule.schema";

describe("Decision Schema", () => {
  it("parses valid tool.call decision", () => {
    const raw = JSON.stringify({
      action: "shell",  // Legacy format: action is the tool name
      parameters: { command: "ls -la" },
      confidence: 0.9,
      thought: "Listing directory contents",
    });

    const result = parseDecision(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.action).toBe("tool.call");
      expect(result.decision.tool).toBe("shell");
      expect(result.decision.args.command).toBe("ls -la");
      expect(result.decision.confidence).toBe(0.9);
    }
  });

  it("parses valid answer.final decision", () => {
    const raw = JSON.stringify({
      action: "answer.final",
      args: { result: "Task completed successfully" },
      confidence: 0.95,
      explanation: "All steps completed",
    });

    const result = parseDecision(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.action).toBe("answer.final");
    }
  });

  it("extracts JSON from markdown code blocks", () => {
    const raw = `Here's my response:
\`\`\`json
{
  "action": "read_file",
  "parameters": { "path": "test.txt" },
  "confidence": 0.8,
  "thought": "Reading file"
}
\`\`\``;

    const result = parseDecision(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.action).toBe("tool.call");
      expect(result.decision.tool).toBe("read_file");
    }
  });

  it("maps legacy 'complete' action to 'answer.final'", () => {
    const raw = JSON.stringify({
      action: "complete",
      parameters: { result: "Done" },
      confidence: 0.9,
      thought: "Task is complete",
    });

    const result = parseDecision(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.action).toBe("answer.final");
    }
  });

  it("returns error for invalid JSON", () => {
    const raw = "This is not JSON at all";
    const result = parseDecision(raw);
    expect(result.ok).toBe(false);
  });
});

describe("Policy Module", () => {
  it("allows shell commands in default allowlist", () => {
    const result = isAllowed({ kind: "shell", command: "ls -la" }, DEFAULT_POLICY);
    expect(result.ok).toBe(true);
  });

  it("allows python commands", () => {
    const result = isAllowed({ kind: "shell", command: "python3 script.py" }, DEFAULT_POLICY);
    expect(result.ok).toBe(true);
  });

  it("denies network access by default", () => {
    const result = isAllowed({ kind: "network", url: "https://example.com" }, DEFAULT_POLICY);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Network access disabled by policy");
  });

  it("allows file operations in workspace", () => {
    const result = isAllowed({ kind: "write_file", path: "/tmp/oracle_workspace/test.txt" }, DEFAULT_POLICY);
    expect(result.ok).toBe(true);
  });

  it("denies file operations outside workspace", () => {
    const result = isAllowed({ kind: "write_file", path: "/etc/passwd" }, DEFAULT_POLICY);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("not in allowlist");
  });

  it("denies dangerous commands not in allowlist", () => {
    const result = isAllowed({ kind: "shell", command: "rm -rf /" }, DEFAULT_POLICY);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("not in allowlist");
  });
});

describe("Trace Module", () => {
  it("creates a new trace with correct structure", () => {
    const trace = createTrace("exec-123", "task-456");
    expect(trace.traceId).toBeDefined();
    expect(trace.executionId).toBe("exec-123");
    expect(trace.taskId).toBe("task-456");
    expect(trace.events).toEqual([]);
    expect(trace.artifacts).toEqual([]);
    expect(trace.checks).toEqual([]);
  });

  it("adds events with timestamp", () => {
    const trace = createTrace("exec-123");
    addTraceEvent(trace, {
      kind: "tool",
      tool: "shell",
      args: { command: "ls" },
      result: { output: "file1.txt" },
      ok: true,
    });

    expect(trace.events.length).toBe(1);
    expect(trace.events[0].kind).toBe("tool");
    expect(trace.events[0].ts).toBeDefined();
    expect(trace.events[0].ok).toBe(true);
  });

  it("adds artifacts correctly", () => {
    const trace = createTrace("exec-123");
    addTraceArtifact(trace, {
      name: "output.txt",
      ref: "https://s3.example.com/output.txt",
      bytes: 1024,
    });

    expect(trace.artifacts.length).toBe(1);
    expect(trace.artifacts[0].name).toBe("output.txt");
  });
});

describe("Capsule Module", () => {
  it("creates a capsule manifest with hash", () => {
    const capsule = createCapsuleManifest(
      "exec-123",
      ["ls -la", "cat file.txt"],
      [{ name: "output.txt", ref: "https://s3.example.com/output.txt", bytes: 100 }],
      [{ command: "ls", exitCode: 0, durationMs: 50 }]
    );

    expect(capsule.capsuleId).toContain("capsule_exec-123");
    expect(capsule.sha256).toBeDefined();
    expect(capsule.sha256.length).toBe(64); // SHA256 hex length
    expect(capsule.commands).toEqual(["ls -la", "cat file.txt"]);
    expect(capsule.artifacts.length).toBe(1);
    expect(capsule.checks.length).toBe(1);
  });

  it("verifies capsule integrity", () => {
    const capsule = createCapsuleManifest(
      "exec-456",
      ["echo hello"],
      [],
      []
    );

    expect(verifyCapsuleIntegrity(capsule)).toBe(true);

    // Tamper with the capsule
    capsule.commands.push("malicious command");
    expect(verifyCapsuleIntegrity(capsule)).toBe(false);
  });
});
