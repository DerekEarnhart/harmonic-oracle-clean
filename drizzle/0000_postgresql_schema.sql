-- PostgreSQL schema for Harmonic Oracle

-- Create enums
CREATE TYPE "role" AS ENUM ('user', 'admin');
CREATE TYPE "cognitive_mode" AS ENUM ('balanced', 'analytical', 'creative', 'cautious');
CREATE TYPE "status" AS ENUM ('pending', 'running', 'completed', 'failed');

-- Users table
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL UNIQUE,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"preferredCognitiveMode" "cognitive_mode" DEFAULT 'balanced'
);

-- Task executions table
CREATE TABLE "task_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"taskPrompt" text NOT NULL,
	"cognitiveMode" "cognitive_mode" DEFAULT 'balanced' NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"iterations" integer DEFAULT 0,
	"executionTimeMs" integer,
	"finalStability" real,
	"finalCoherence" real,
	"finalConfidence" real,
	"finalResult" text,
	"errorMessage" text,
	"artifactUrls" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);

-- Execution steps table
CREATE TABLE "execution_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"executionId" integer NOT NULL,
	"stepNumber" integer NOT NULL,
	"thought" text,
	"action" varchar(64),
	"actionParams" json,
	"result" text,
	"stability" real,
	"coherence" real,
	"confidence" real,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Benchmark results table
CREATE TABLE "benchmark_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"runDate" timestamp DEFAULT now() NOT NULL,
	"basicSuccessRate" real,
	"basicAvgTime" real,
	"basicAvgIterations" real,
	"harmonicBalancedSuccessRate" real,
	"harmonicBalancedAvgTime" real,
	"harmonicBalancedAvgIterations" real,
	"harmonicBalancedAvgStability" real,
	"harmonicBalancedAvgCoherence" real,
	"harmonicAnalyticalSuccessRate" real,
	"harmonicAnalyticalAvgTime" real,
	"harmonicAnalyticalAvgIterations" real,
	"harmonicAnalyticalAvgStability" real,
	"avgEmbeddingTimeMs" real,
	"avgThinkingTimeMs" real,
	"avgLearningTimeMs" real,
	"rawResults" json
);
