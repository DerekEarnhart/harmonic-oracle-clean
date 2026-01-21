import { z } from "zod";

/**
 * Strict Decision schema for the LLM.
 * - No chain-of-thought. No debates. No raw logs.
 * - operator_trace is a short list of named transforms (Dω, Q_S, Pφ, etc.)
 * - sources are internal IDs/hashes (capsule ids, file hashes, retrieved chunk ids)
 */
export const zDecision = z.object({
  action: z.enum(["tool.call", "answer.final", "abstain", "plan.update"]),
  tool: z.string().optional(),               // required if action == tool.call
  args: z.record(z.string(), z.any()).default({}),       // tool arguments
  confidence: z.number().min(0).max(1).default(0.5),

  operator_trace: z.array(z.object({
    op: z.string(),                          // e.g. "Q_S", "Dω", "Pφ"
    note: z.string().optional(),
  })).default([]),

  sources: z.array(z.string()).default([]),

  // Optional: a short user-visible explanation (<= 800 chars)
  explanation: z.string().max(800).optional(),
});

export type Decision = z.infer<typeof zDecision>;

/**
 * Tool-specific argument schemas for validation
 */
export const zToolArgs = {
  shell: z.object({
    command: z.string().min(1).max(2000),
  }),
  write_file: z.object({
    path: z.string().min(1).max(500),
    content: z.string().max(100000),
  }),
  read_file: z.object({
    path: z.string().min(1).max(500),
  }),
  harmonic_analyze: z.object({
    concept: z.string().min(1).max(1000),
  }),
};

/**
 * Parse and validate a Decision from raw LLM output
 */
export function parseDecision(raw: string): { ok: true; decision: Decision } | { ok: false; error: string } {
  try {
    // Try to extract JSON from markdown code blocks first
    let jsonContent = raw;
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    } else {
      // Try to extract JSON object
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
    }
    
    const parsed = JSON.parse(jsonContent);
    
    // Map legacy format to new schema
    const mapped = {
      action: mapLegacyAction(parsed.action),
      tool: parsed.action !== "complete" && parsed.action !== "answer.final" ? parsed.action : undefined,
      args: parsed.parameters || parsed.args || {},
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      operator_trace: parsed.operator_trace || [],
      sources: parsed.sources || [],
      explanation: parsed.thought || parsed.explanation,
    };
    
    const result = zDecision.safeParse(mapped);
    if (!result.success) {
      return { ok: false, error: `Schema validation failed: ${result.error.message}` };
    }
    
    return { ok: true, decision: result.data };
  } catch (e) {
    return { ok: false, error: `JSON parse failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

function mapLegacyAction(action: string): Decision["action"] {
  switch (action) {
    case "complete":
      return "answer.final";
    case "shell":
    case "write_file":
    case "read_file":
    case "harmonic_analyze":
      return "tool.call";
    default:
      if (["tool.call", "answer.final", "abstain", "plan.update"].includes(action)) {
        return action as Decision["action"];
      }
      return "tool.call";
  }
}
