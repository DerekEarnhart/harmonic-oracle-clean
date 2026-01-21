import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { BENCHMARK_DATA } from "./oracle";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("benchmark.getComparison", () => {
  it("returns benchmark comparison data with correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.benchmark.getComparison();

    expect(result).toBeDefined();
    expect(result.successRates).toHaveLength(3);
    expect(result.executionTimes).toHaveLength(3);
    expect(result.iterations).toHaveLength(3);
    expect(result.corePerformance).toBeDefined();
    expect(result.corePerformance.embedding).toBe(BENCHMARK_DATA.summary.harmonic_agent_core.avg_embedding_time_ms);
    expect(result.corePerformance.thinking).toBe(BENCHMARK_DATA.summary.harmonic_agent_core.avg_thinking_time_ms);
    expect(result.corePerformance.learning).toBe(BENCHMARK_DATA.summary.harmonic_agent_core.avg_learning_time_ms);
  });

  it("returns correct success rates for each oracle type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.benchmark.getComparison();

    const basicRate = result.successRates.find(r => r.name === "Basic Oracle");
    const balancedRate = result.successRates.find(r => r.name === "Harmonic (Balanced)");
    const analyticalRate = result.successRates.find(r => r.name === "Harmonic (Analytical)");

    expect(basicRate?.value).toBe(83.33);
    expect(balancedRate?.value).toBe(100.0);
    expect(analyticalRate?.value).toBe(100.0);
  });
});

describe("benchmark.getLatest", () => {
  it("returns benchmark data with all required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.benchmark.getLatest();

    expect(result).toBeDefined();
    expect(result.basicSuccessRate).toBe(BENCHMARK_DATA.summary.basic_oracle.success_rate);
    expect(result.harmonicBalancedSuccessRate).toBe(BENCHMARK_DATA.summary.harmonic_balanced.success_rate);
    expect(result.harmonicAnalyticalSuccessRate).toBe(BENCHMARK_DATA.summary.harmonic_analytical.success_rate);
    expect(result.avgThinkingTimeMs).toBe(BENCHMARK_DATA.summary.harmonic_agent_core.avg_thinking_time_ms);
  });
});

describe("oracle.getRecentExecutions", () => {
  it("returns an array (empty if no executions)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.oracle.getRecentExecutions({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-123");
    expect(result?.email).toBe("test@example.com");
  });
});
