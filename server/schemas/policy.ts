/**
 * SafeSet-style policy skeleton.
 * This is a simple allowlist gate for bounded omnipotence.
 */

export type ActionKind = "shell" | "read_file" | "write_file" | "network";

export type Action = {
  kind: ActionKind;
  command?: string;
  path?: string;
  url?: string;
};

export type Policy = {
  allowShell: boolean;
  allowNetwork: boolean;
  pathAllowlist: string[];
  cmdAllowlist: string[];
  hostAllowlist: string[];
};

export type PolicyDecision = {
  ok: boolean;
  reason?: string;
  action: Action;
  policy: Policy;
};

/**
 * Default restrictive policy
 */
export const DEFAULT_POLICY: Policy = {
  allowShell: true,
  allowNetwork: false,
  pathAllowlist: ["/tmp/oracle_workspace"],
  cmdAllowlist: [
    "ls", "cat", "echo", "pwd", "mkdir", "touch", "cp", "mv",
    "python", "python3", "node", "npm", "pnpm",
    "git", "curl", "wget",
    "grep", "find", "head", "tail", "wc",
  ],
  hostAllowlist: [],
};

/**
 * Check if an action is allowed by the policy
 */
export function isAllowed(action: Action, policy: Policy = DEFAULT_POLICY): PolicyDecision {
  const decision: PolicyDecision = { ok: false, action, policy };

  if (action.kind === "shell") {
    if (!policy.allowShell) {
      decision.reason = "Shell execution disabled by policy";
      return decision;
    }
    
    if (action.command && policy.cmdAllowlist.length > 0) {
      // Extract the base command (first word)
      const baseCmd = action.command.trim().split(/\s+/)[0];
      const allowed = policy.cmdAllowlist.some(prefix => 
        baseCmd === prefix || baseCmd.startsWith(prefix + " ")
      );
      if (!allowed) {
        decision.reason = `Command '${baseCmd}' not in allowlist`;
        return decision;
      }
    }
    
    decision.ok = true;
    return decision;
  }

  if (action.kind === "network") {
    if (!policy.allowNetwork) {
      decision.reason = "Network access disabled by policy";
      return decision;
    }
    
    if (action.url && policy.hostAllowlist.length > 0) {
      try {
        const url = new URL(action.url);
        const allowed = policy.hostAllowlist.includes(url.hostname);
        if (!allowed) {
          decision.reason = `Host '${url.hostname}' not in allowlist`;
          return decision;
        }
      } catch {
        decision.reason = "Invalid URL";
        return decision;
      }
    }
    
    decision.ok = true;
    return decision;
  }

  if (action.kind === "read_file" || action.kind === "write_file") {
    if (!action.path) {
      decision.reason = "Missing file path";
      return decision;
    }
    
    const allowed = policy.pathAllowlist.some(prefix => 
      action.path!.startsWith(prefix)
    );
    if (!allowed) {
      decision.reason = `Path '${action.path}' not in allowlist`;
      return decision;
    }
    
    decision.ok = true;
    return decision;
  }

  decision.reason = "Unknown action kind";
  return decision;
}

/**
 * Create a trace event for a policy decision
 */
export function policyTraceEvent(decision: PolicyDecision): {
  kind: "policy";
  op: string;
  result: { allowed: boolean; reason?: string };
  refs: string[];
} {
  return {
    kind: "policy",
    op: `policy.${decision.action.kind}`,
    result: {
      allowed: decision.ok,
      reason: decision.reason,
    },
    refs: [],
  };
}
