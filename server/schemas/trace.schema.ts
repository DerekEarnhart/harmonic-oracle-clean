import { z } from "zod";

/**
 * Trace is your primary "truth record":
 * - what was used (sources), what was done (tools), what checks ran, what changed (diff hashes)
 * - This is what makes the system "post-LLM": verifiers decide; trace proves.
 */
export const zTraceEvent = z.object({
  ts: z.string(),                            // ISO timestamp
  kind: z.enum(["operator", "tool", "check", "artifact", "note", "policy"]),
  op: z.string().optional(),                 // operator name (Dω, Q_S, etc.)
  tool: z.string().optional(),
  args: z.record(z.string(), z.any()).optional(),
  result: z.any().optional(),
  ok: z.boolean().optional(),

  // references, never huge blobs
  refs: z.array(z.string()).default([]),
});

export type TraceEvent = z.infer<typeof zTraceEvent>;

export const zTrace = z.object({
  traceId: z.string(),                       // uuid
  taskId: z.string().optional(),
  executionId: z.string().optional(),
  createdAt: z.string(),
  model: z.string().optional(),

  // sources used for claims/decisions
  sources: z.array(z.object({
    id: z.string(),                          // capsuleId, file hash, chunk id
    kind: z.enum(["capsule", "file", "chunk", "url", "note"]),
    desc: z.string().optional(),
  })).default([]),

  events: z.array(zTraceEvent).default([]),

  checks: z.array(z.object({
    command: z.string(),
    exitCode: z.number(),
    durationMs: z.number().optional(),
    logRef: z.string().optional(),           // pointer to stored logs
  })).default([]),

  artifacts: z.array(z.object({
    name: z.string(),
    ref: z.string(),                         // url or sha256
    bytes: z.number().optional(),
    mimeType: z.string().optional(),
  })).default([]),

  capsule: z.object({
    capsuleId: z.string(),
    sha256: z.string(),
    url: z.string().optional(),
  }).optional(),
});

export type Trace = z.infer<typeof zTrace>;

/**
 * Create a new trace for an execution
 */
export function createTrace(executionId: string, taskId?: string): Trace {
  return {
    traceId: crypto.randomUUID(),
    taskId,
    executionId,
    createdAt: new Date().toISOString(),
    sources: [],
    events: [],
    checks: [],
    artifacts: [],
  };
}

/**
 * Add an event to the trace
 */
export function addTraceEvent(trace: Trace, event: Omit<TraceEvent, "ts" | "refs"> & { refs?: string[] }): void {
  trace.events.push({
    refs: [],
    ...event,
    ts: new Date().toISOString(),
  });
}

/**
 * Add an artifact to the trace
 */
export function addTraceArtifact(trace: Trace, artifact: { name: string; ref: string; bytes?: number; mimeType?: string }): void {
  trace.artifacts.push(artifact);
}

/**
 * Add a check result to the trace
 */
export function addTraceCheck(trace: Trace, check: { command: string; exitCode: number; durationMs?: number; logRef?: string }): void {
  trace.checks.push(check);
}
