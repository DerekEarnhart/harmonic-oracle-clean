CREATE TABLE `benchmark_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runDate` timestamp NOT NULL DEFAULT (now()),
	`basicSuccessRate` float,
	`basicAvgTime` float,
	`basicAvgIterations` float,
	`harmonicBalancedSuccessRate` float,
	`harmonicBalancedAvgTime` float,
	`harmonicBalancedAvgIterations` float,
	`harmonicBalancedAvgStability` float,
	`harmonicBalancedAvgCoherence` float,
	`harmonicAnalyticalSuccessRate` float,
	`harmonicAnalyticalAvgTime` float,
	`harmonicAnalyticalAvgIterations` float,
	`harmonicAnalyticalAvgStability` float,
	`avgEmbeddingTimeMs` float,
	`avgThinkingTimeMs` float,
	`avgLearningTimeMs` float,
	`rawResults` json,
	CONSTRAINT `benchmark_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`thought` text,
	`action` varchar(64),
	`actionParams` json,
	`result` text,
	`stability` float,
	`coherence` float,
	`confidence` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `execution_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskPrompt` text NOT NULL,
	`cognitiveMode` enum('balanced','analytical','creative','cautious') NOT NULL DEFAULT 'balanced',
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`iterations` int DEFAULT 0,
	`executionTimeMs` int,
	`finalStability` float,
	`finalCoherence` float,
	`finalConfidence` float,
	`finalResult` text,
	`errorMessage` text,
	`artifactUrls` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `task_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `preferredCognitiveMode` enum('balanced','analytical','creative','cautious') DEFAULT 'balanced';