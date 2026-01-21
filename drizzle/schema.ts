import { integer, pgEnum, pgTable, text, timestamp, varchar, json, real, serial } from "drizzle-orm/pg-core";

/**
 * Enums
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const cognitiveModeEnum = pgEnum("cognitive_mode", ["balanced", "analytical", "creative", "cautious"]);
export const statusEnum = pgEnum("status", ["pending", "running", "completed", "failed"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // User preferences
  preferredCognitiveMode: cognitiveModeEnum("preferredCognitiveMode").default("balanced"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Task executions table - stores each task submitted to the Oracle
 */
export const taskExecutions = pgTable("task_executions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  taskPrompt: text("taskPrompt").notNull(),
  cognitiveMode: cognitiveModeEnum("cognitiveMode").default("balanced").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  
  // Execution metrics
  iterations: integer("iterations").default(0),
  executionTimeMs: integer("executionTimeMs"),
  
  // Final cognitive state
  finalStability: real("finalStability"),
  finalCoherence: real("finalCoherence"),
  finalConfidence: real("finalConfidence"),
  
  // Results
  finalResult: text("finalResult"),
  errorMessage: text("errorMessage"),
  
  // Generated artifacts (S3 URLs)
  artifactUrls: json("artifactUrls").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type TaskExecution = typeof taskExecutions.$inferSelect;
export type InsertTaskExecution = typeof taskExecutions.$inferInsert;

/**
 * Execution steps - stores each iteration/step of a task execution
 */
export const executionSteps = pgTable("execution_steps", {
  id: serial("id").primaryKey(),
  executionId: integer("executionId").notNull(),
  stepNumber: integer("stepNumber").notNull(),
  
  // Step details
  thought: text("thought"),
  action: varchar("action", { length: 64 }),
  actionParams: json("actionParams"),
  result: text("result"),
  
  // Cognitive metrics at this step
  stability: real("stability"),
  coherence: real("coherence"),
  confidence: real("confidence"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExecutionStep = typeof executionSteps.$inferSelect;
export type InsertExecutionStep = typeof executionSteps.$inferInsert;

/**
 * Benchmark results - stores benchmark run data for visualization
 */
export const benchmarkResults = pgTable("benchmark_results", {
  id: serial("id").primaryKey(),
  runDate: timestamp("runDate").defaultNow().notNull(),
  
  // Basic Oracle metrics
  basicSuccessRate: real("basicSuccessRate"),
  basicAvgTime: real("basicAvgTime"),
  basicAvgIterations: real("basicAvgIterations"),
  
  // Harmonic Balanced metrics
  harmonicBalancedSuccessRate: real("harmonicBalancedSuccessRate"),
  harmonicBalancedAvgTime: real("harmonicBalancedAvgTime"),
  harmonicBalancedAvgIterations: real("harmonicBalancedAvgIterations"),
  harmonicBalancedAvgStability: real("harmonicBalancedAvgStability"),
  harmonicBalancedAvgCoherence: real("harmonicBalancedAvgCoherence"),
  
  // Harmonic Analytical metrics
  harmonicAnalyticalSuccessRate: real("harmonicAnalyticalSuccessRate"),
  harmonicAnalyticalAvgTime: real("harmonicAnalyticalAvgTime"),
  harmonicAnalyticalAvgIterations: real("harmonicAnalyticalAvgIterations"),
  harmonicAnalyticalAvgStability: real("harmonicAnalyticalAvgStability"),
  
  // Core performance
  avgEmbeddingTimeMs: real("avgEmbeddingTimeMs"),
  avgThinkingTimeMs: real("avgThinkingTimeMs"),
  avgLearningTimeMs: real("avgLearningTimeMs"),
  
  // Raw data
  rawResults: json("rawResults"),
});

export type BenchmarkResult = typeof benchmarkResults.$inferSelect;
export type InsertBenchmarkResult = typeof benchmarkResults.$inferInsert;
