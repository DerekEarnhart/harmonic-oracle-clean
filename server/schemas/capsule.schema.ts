import { z } from "zod";
import { createHash } from "crypto";

/**
 * Capsule manifest: describes what is inside the replayable bundle.
 * The bundle itself can be stored by hash.
 */
export const zCapsuleManifest = z.object({
  capsuleId: z.string(),
  createdAt: z.string(),
  sha256: z.string(),

  // inputs
  repo: z.object({
    kind: z.enum(["snapshot", "diff"]),
    ref: z.string(), // url or hash
  }).optional(),

  environment: z.object({
    os: z.string().optional(),
    runtime: z.record(z.string(), z.string()).default({}), // { node: "20.x", python: "3.11" }
    lockfiles: z.array(z.string()).default([]),
  }).default({ runtime: {}, lockfiles: [] }),

  commands: z.array(z.string()).default([]),

  // verification results
  checks: z.array(z.object({
    command: z.string(),
    exitCode: z.number(),
    durationMs: z.number().optional(),
  })).default([]),

  // pointers to logs and artifacts
  logsRef: z.string().optional(),
  artifacts: z.array(z.object({
    name: z.string(),
    ref: z.string(), // url or sha256
    bytes: z.number().optional(),
  })).default([]),

  traceRef: z.string().optional(), // url or hash of trace.json
});

export type CapsuleManifest = z.infer<typeof zCapsuleManifest>;

/**
 * Create a new capsule manifest
 */
export function createCapsuleManifest(
  executionId: string,
  commands: string[],
  artifacts: Array<{ name: string; ref: string; bytes?: number }>,
  checks: Array<{ command: string; exitCode: number; durationMs?: number }>,
  traceRef?: string
): CapsuleManifest {
  const capsuleId = `capsule_${executionId}_${Date.now()}`;
  const createdAt = new Date().toISOString();
  
  // Create manifest content for hashing
  const manifestContent = JSON.stringify({
    capsuleId,
    createdAt,
    commands,
    artifacts,
    checks,
    traceRef,
  });
  
  const sha256 = createHash("sha256").update(manifestContent).digest("hex");
  
  return {
    capsuleId,
    createdAt,
    sha256,
    environment: {
      os: process.platform,
      runtime: {
        node: process.version,
      },
      lockfiles: [],
    },
    commands,
    checks,
    artifacts,
    traceRef,
  };
}

/**
 * Serialize capsule manifest to JSON
 */
export function serializeCapsule(manifest: CapsuleManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Verify capsule integrity by recalculating hash
 */
export function verifyCapsuleIntegrity(manifest: CapsuleManifest): boolean {
  const contentForHash = JSON.stringify({
    capsuleId: manifest.capsuleId,
    createdAt: manifest.createdAt,
    commands: manifest.commands,
    artifacts: manifest.artifacts,
    checks: manifest.checks,
    traceRef: manifest.traceRef,
  });
  
  const calculatedHash = createHash("sha256").update(contentForHash).digest("hex");
  return calculatedHash === manifest.sha256;
}
