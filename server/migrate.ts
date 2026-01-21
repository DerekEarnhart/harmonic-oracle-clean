import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log("[Migration] DATABASE_URL not set, skipping migrations");
    return;
  }

  console.log("[Migration] Starting database migrations...");
  
  try {
    // Create a postgres connection for migrations
    const migrationClient = postgres(databaseUrl, { max: 1 });
    const db = drizzle(migrationClient);
    
    // Run migrations
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    console.log("[Migration] Migrations completed successfully");
    
    // Close the migration connection
    await migrationClient.end();
  } catch (error) {
    console.error("[Migration] Failed to run migrations:", error);
    throw error;
  }
}

export { runMigrations };
