import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, 
  taskExecutions, InsertTaskExecution, TaskExecution,
  executionSteps, InsertExecutionStep, ExecutionStep,
  benchmarkResults, InsertBenchmarkResult, BenchmarkResult
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPreferences(userId: number, preferredCognitiveMode: "balanced" | "analytical" | "creative" | "cautious") {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users)
    .set({ preferredCognitiveMode })
    .where(eq(users.id, userId));
}

// ============ TASK EXECUTION QUERIES ============

export async function createTaskExecution(data: InsertTaskExecution): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(taskExecutions).values(data).returning({ id: taskExecutions.id });
  return result[0].id;
}

export async function updateTaskExecution(id: number, data: Partial<InsertTaskExecution>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(taskExecutions)
    .set(data)
    .where(eq(taskExecutions.id, id));
}

export async function getTaskExecution(id: number): Promise<TaskExecution | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(taskExecutions).where(eq(taskExecutions.id, id)).limit(1);
  return result[0];
}

export async function getUserTaskExecutions(userId: number, limit = 50): Promise<TaskExecution[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(taskExecutions)
    .where(eq(taskExecutions.userId, userId))
    .orderBy(desc(taskExecutions.createdAt))
    .limit(limit);
}

export async function getRecentTaskExecutions(limit = 20): Promise<TaskExecution[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(taskExecutions)
    .orderBy(desc(taskExecutions.createdAt))
    .limit(limit);
}

// ============ EXECUTION STEP QUERIES ============

export async function createExecutionStep(data: InsertExecutionStep): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(executionSteps).values(data).returning({ id: executionSteps.id });
  return result[0].id;
}

export async function getExecutionSteps(executionId: number): Promise<ExecutionStep[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(executionSteps)
    .where(eq(executionSteps.executionId, executionId))
    .orderBy(executionSteps.stepNumber);
}

// ============ BENCHMARK QUERIES ============

export async function createBenchmarkResult(data: InsertBenchmarkResult): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(benchmarkResults).values(data).returning({ id: benchmarkResults.id });
  return result[0].id;
}

export async function getLatestBenchmarkResult(): Promise<BenchmarkResult | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(benchmarkResults)
    .orderBy(desc(benchmarkResults.runDate))
    .limit(1);
  return result[0];
}

export async function getAllBenchmarkResults(): Promise<BenchmarkResult[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(benchmarkResults)
    .orderBy(desc(benchmarkResults.runDate));
}
