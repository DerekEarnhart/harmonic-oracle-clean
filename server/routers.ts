import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createTaskExecution, 
  getTaskExecution, 
  getUserTaskExecutions, 
  getExecutionSteps,
  getLatestBenchmarkResult,
  updateUserPreferences,
  getRecentTaskExecutions
} from "./db";
import { executeOracleTaskV2, CognitiveMode, BENCHMARK_DATA } from "./oracle-v2";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

// Event emitter for real-time progress updates
const progressEmitter = new EventEmitter();
progressEmitter.setMaxListeners(100);

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Oracle task execution
  oracle: router({
    // Submit a new task for execution
    submitTask: protectedProcedure
      .input(z.object({
        taskPrompt: z.string().min(1).max(5000),
        cognitiveMode: z.enum(["balanced", "analytical", "creative", "cautious"]).default("balanced"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create task execution record
        const executionId = await createTaskExecution({
          userId: ctx.user.id,
          taskPrompt: input.taskPrompt,
          cognitiveMode: input.cognitiveMode,
          status: "running",
        });

        // Start execution in background (V2 with verifier-first architecture)
        executeOracleTaskV2(
          input.taskPrompt,
          input.cognitiveMode as CognitiveMode,
          executionId,
          (progress) => {
            progressEmitter.emit(`progress:${executionId}`, progress);
          }
        ).catch(console.error);

        return { executionId };
      }),

    // Get task execution details
    getExecution: protectedProcedure
      .input(z.object({ executionId: z.number() }))
      .query(async ({ input }) => {
        const execution = await getTaskExecution(input.executionId);
        if (!execution) return null;
        
        const steps = await getExecutionSteps(input.executionId);
        return { execution, steps };
      }),

    // Get user's task history
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ ctx, input }) => {
        return getUserTaskExecutions(ctx.user.id, input.limit);
      }),

    // Get recent public executions (for demo/showcase)
    getRecentExecutions: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
      .query(async ({ input }) => {
        return getRecentTaskExecutions(input.limit);
      }),
  }),

  // Benchmark data
  benchmark: router({
    // Get latest benchmark results
    getLatest: publicProcedure.query(async () => {
      const dbResult = await getLatestBenchmarkResult();
      if (dbResult) return dbResult;
      
      // Return hardcoded benchmark data if no DB results
      return {
        id: 0,
        runDate: new Date(BENCHMARK_DATA.timestamp),
        basicSuccessRate: BENCHMARK_DATA.summary.basic_oracle.success_rate,
        basicAvgTime: BENCHMARK_DATA.summary.basic_oracle.avg_time,
        basicAvgIterations: BENCHMARK_DATA.summary.basic_oracle.avg_iterations,
        harmonicBalancedSuccessRate: BENCHMARK_DATA.summary.harmonic_balanced.success_rate,
        harmonicBalancedAvgTime: BENCHMARK_DATA.summary.harmonic_balanced.avg_time,
        harmonicBalancedAvgIterations: BENCHMARK_DATA.summary.harmonic_balanced.avg_iterations,
        harmonicBalancedAvgStability: BENCHMARK_DATA.summary.harmonic_balanced.avg_stability,
        harmonicBalancedAvgCoherence: BENCHMARK_DATA.summary.harmonic_balanced.avg_coherence,
        harmonicAnalyticalSuccessRate: BENCHMARK_DATA.summary.harmonic_analytical.success_rate,
        harmonicAnalyticalAvgTime: BENCHMARK_DATA.summary.harmonic_analytical.avg_time,
        harmonicAnalyticalAvgIterations: BENCHMARK_DATA.summary.harmonic_analytical.avg_iterations,
        harmonicAnalyticalAvgStability: BENCHMARK_DATA.summary.harmonic_analytical.avg_stability,
        avgEmbeddingTimeMs: BENCHMARK_DATA.summary.harmonic_agent_core.avg_embedding_time_ms,
        avgThinkingTimeMs: BENCHMARK_DATA.summary.harmonic_agent_core.avg_thinking_time_ms,
        avgLearningTimeMs: BENCHMARK_DATA.summary.harmonic_agent_core.avg_learning_time_ms,
        rawResults: null,
      };
    }),

    // Get comparison data for charts
    getComparison: publicProcedure.query(() => {
      return {
        successRates: [
          { name: "Basic Oracle", value: BENCHMARK_DATA.summary.basic_oracle.success_rate },
          { name: "Harmonic (Balanced)", value: BENCHMARK_DATA.summary.harmonic_balanced.success_rate },
          { name: "Harmonic (Analytical)", value: BENCHMARK_DATA.summary.harmonic_analytical.success_rate },
        ],
        executionTimes: [
          { name: "Basic Oracle", value: BENCHMARK_DATA.summary.basic_oracle.avg_time },
          { name: "Harmonic (Balanced)", value: BENCHMARK_DATA.summary.harmonic_balanced.avg_time },
          { name: "Harmonic (Analytical)", value: BENCHMARK_DATA.summary.harmonic_analytical.avg_time },
        ],
        iterations: [
          { name: "Basic Oracle", value: BENCHMARK_DATA.summary.basic_oracle.avg_iterations },
          { name: "Harmonic (Balanced)", value: BENCHMARK_DATA.summary.harmonic_balanced.avg_iterations },
          { name: "Harmonic (Analytical)", value: BENCHMARK_DATA.summary.harmonic_analytical.avg_iterations },
        ],
        corePerformance: {
          embedding: BENCHMARK_DATA.summary.harmonic_agent_core.avg_embedding_time_ms,
          thinking: BENCHMARK_DATA.summary.harmonic_agent_core.avg_thinking_time_ms,
          learning: BENCHMARK_DATA.summary.harmonic_agent_core.avg_learning_time_ms,
        },
      };
    }),
  }),

  // User preferences
  preferences: router({
    updateCognitiveMode: protectedProcedure
      .input(z.object({
        mode: z.enum(["balanced", "analytical", "creative", "cautious"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserPreferences(ctx.user.id, input.mode);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
