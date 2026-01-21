/**
 * Harmonic Oracle Benchmark Suite
 * 
 * This module defines a comprehensive set of benchmark tasks to evaluate
 * the Harmonic Oracle's performance across diverse scenarios.
 */

export interface BenchmarkTask {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: "computation" | "file_ops" | "analysis" | "reasoning" | "multi_step";
  difficulty: "easy" | "medium" | "hard";
  expectedOutputType: "file" | "calculation" | "analysis" | "code";
  verificationCriteria: string[];
}

export const BENCHMARK_TASKS: BenchmarkTask[] = [
  // ===== COMPUTATION TASKS =====
  {
    id: "calc_fibonacci",
    name: "Fibonacci Sequence",
    description: "Calculate the first 20 Fibonacci numbers",
    prompt: "Calculate and output the first 20 numbers in the Fibonacci sequence. Save the results to a file called fibonacci.txt with one number per line.",
    category: "computation",
    difficulty: "easy",
    expectedOutputType: "file",
    verificationCriteria: [
      "File fibonacci.txt exists",
      "Contains exactly 20 lines",
      "First number is 0 or 1",
      "Last number is correct (4181 or 6765 depending on starting point)"
    ]
  },
  {
    id: "calc_primes",
    name: "Prime Numbers",
    description: "Find all prime numbers between 1 and 100",
    prompt: "Find all prime numbers between 1 and 100. Save them to a file called primes.txt, one per line.",
    category: "computation",
    difficulty: "easy",
    expectedOutputType: "file",
    verificationCriteria: [
      "File primes.txt exists",
      "Contains 25 prime numbers",
      "Includes 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97"
    ]
  },
  {
    id: "calc_statistics",
    name: "Statistical Analysis",
    description: "Calculate mean, median, and standard deviation of a dataset",
    prompt: "Create a dataset of 50 random numbers between 1 and 100. Calculate the mean, median, mode, and standard deviation. Save the results to stats.json with the format: {\"data\": [...], \"mean\": X, \"median\": Y, \"mode\": Z, \"std_dev\": W}",
    category: "computation",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "File stats.json exists",
      "Valid JSON format",
      "Contains 'data' array with 50 numbers",
      "Contains calculated statistics"
    ]
  },

  // ===== FILE OPERATIONS TASKS =====
  {
    id: "file_create_structure",
    name: "Directory Structure Creation",
    description: "Create a multi-level directory structure",
    prompt: "Create the following directory structure: project/src/components, project/src/utils, project/tests, project/docs. Then create an empty README.md file in the project directory.",
    category: "file_ops",
    difficulty: "easy",
    expectedOutputType: "file",
    verificationCriteria: [
      "Directory project/src/components exists",
      "Directory project/src/utils exists",
      "Directory project/tests exists",
      "Directory project/docs exists",
      "File project/README.md exists"
    ]
  },
  {
    id: "file_text_processing",
    name: "Text File Processing",
    description: "Process and transform text data",
    prompt: "Create a file called input.txt with 10 lines of sample text. Then create a script that reads the file, converts all text to uppercase, removes duplicate lines, sorts alphabetically, and saves to output.txt.",
    category: "file_ops",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "File input.txt exists with 10 lines",
      "File output.txt exists",
      "Output is uppercase",
      "Output is sorted alphabetically",
      "No duplicate lines in output"
    ]
  },
  {
    id: "file_json_manipulation",
    name: "JSON Data Manipulation",
    description: "Parse, modify, and save JSON data",
    prompt: "Create a JSON file called users.json with 5 user objects (id, name, email, age). Write a script that reads the file, filters users over age 25, adds a 'status': 'active' field to each, and saves to active_users.json.",
    category: "file_ops",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "File users.json exists with valid JSON",
      "File active_users.json exists",
      "Filtered users are over age 25",
      "Each user has 'status': 'active' field"
    ]
  },

  // ===== ANALYSIS TASKS =====
  {
    id: "analysis_log_parsing",
    name: "Log File Analysis",
    description: "Parse and analyze log file data",
    prompt: "Create a mock log file with 20 entries containing timestamps, log levels (INFO, WARN, ERROR), and messages. Write a script to analyze it and create a summary report showing: total entries, count by level, and list of all ERROR messages. Save to log_analysis.txt.",
    category: "analysis",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "Mock log file created",
      "File log_analysis.txt exists",
      "Contains total entry count",
      "Contains breakdown by log level",
      "Lists all ERROR messages"
    ]
  },
  {
    id: "analysis_data_validation",
    name: "Data Validation",
    description: "Validate data against rules and report issues",
    prompt: "Create a CSV file with 15 rows of user data (name, email, age, phone). Include some intentionally invalid entries (missing emails, ages over 150, invalid phone formats). Write a validation script that identifies all issues and creates a validation_report.json.",
    category: "analysis",
    difficulty: "hard",
    expectedOutputType: "file",
    verificationCriteria: [
      "CSV file created with mixed valid/invalid data",
      "File validation_report.json exists",
      "Identifies missing email issues",
      "Identifies age validation issues",
      "Identifies phone format issues"
    ]
  },

  // ===== REASONING TASKS =====
  {
    id: "reason_problem_solving",
    name: "Multi-Step Problem Solving",
    description: "Solve a problem requiring multiple reasoning steps",
    prompt: "You have 100 dollars. You buy 3 items: one costs $23.50, another costs $41.25, and the third costs $18.99. Calculate your remaining balance, then determine how many $5 items you can buy with the remainder. Save your step-by-step calculation to calculation.txt.",
    category: "reasoning",
    difficulty: "easy",
    expectedOutputType: "file",
    verificationCriteria: [
      "File calculation.txt exists",
      "Shows initial amount",
      "Shows all purchases",
      "Shows correct remaining balance ($16.26)",
      "Shows correct number of $5 items (3)"
    ]
  },
  {
    id: "reason_pattern_recognition",
    name: "Pattern Recognition",
    description: "Identify and extend patterns",
    prompt: "Given the sequence: 2, 6, 12, 20, 30, 42... Identify the pattern, explain the rule, and generate the next 5 numbers. Save your explanation and the extended sequence to pattern.txt.",
    category: "reasoning",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "File pattern.txt exists",
      "Correctly identifies pattern (n * (n+1))",
      "Provides clear explanation",
      "Generates correct next 5 numbers: 56, 72, 90, 110, 132"
    ]
  },

  // ===== MULTI-STEP TASKS =====
  {
    id: "multi_data_pipeline",
    name: "Data Processing Pipeline",
    description: "Build a multi-stage data processing pipeline",
    prompt: "Create a data pipeline: 1) Generate 30 random numbers (1-100) and save to raw_data.txt, 2) Read the file and filter numbers > 50, 3) Calculate average of filtered numbers, 4) Create a summary report in pipeline_report.json with: raw_count, filtered_count, filtered_average, and timestamp.",
    category: "multi_step",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "File raw_data.txt exists with 30 numbers",
      "File pipeline_report.json exists",
      "Report contains all required fields",
      "Filtered average is correctly calculated",
      "Timestamp is present"
    ]
  },
  {
    id: "multi_report_generation",
    name: "Automated Report Generation",
    description: "Generate a comprehensive report from multiple data sources",
    prompt: "Create a system status report: 1) Get current date/time, 2) Create mock system metrics (CPU: 45%, Memory: 62%, Disk: 78%), 3) List 5 mock recent events with timestamps, 4) Generate a formatted report in system_report.md with sections for Overview, Metrics, Recent Events, and Recommendations.",
    category: "multi_step",
    difficulty: "hard",
    expectedOutputType: "file",
    verificationCriteria: [
      "File system_report.md exists",
      "Contains Overview section with date/time",
      "Contains Metrics section with all values",
      "Contains Recent Events section with 5 events",
      "Contains Recommendations section",
      "Properly formatted Markdown"
    ]
  },
  {
    id: "multi_code_generation",
    name: "Code Generation and Testing",
    description: "Generate code and verify it works",
    prompt: "Create a Python script called calculator.py with functions for add, subtract, multiply, and divide. Then create a test script test_calculator.py that tests all functions with sample inputs. Run the tests and save the results to test_results.txt.",
    category: "multi_step",
    difficulty: "hard",
    expectedOutputType: "code",
    verificationCriteria: [
      "File calculator.py exists with all 4 functions",
      "File test_calculator.py exists",
      "Tests cover all functions",
      "File test_results.txt shows test execution",
      "All tests pass"
    ]
  },

  // ===== EDGE CASE TASKS =====
  {
    id: "edge_empty_handling",
    name: "Empty Data Handling",
    description: "Handle edge cases with empty or missing data",
    prompt: "Create a script that attempts to read a non-existent file called missing.txt, handles the error gracefully, creates the file with default content 'File created', then reads and verifies the content. Save a log of all operations to edge_case_log.txt.",
    category: "reasoning",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "Script handles missing file error",
      "File missing.txt is created",
      "Contains 'File created' content",
      "File edge_case_log.txt documents all operations"
    ]
  },
  {
    id: "edge_large_numbers",
    name: "Large Number Computation",
    description: "Handle computations with very large numbers",
    prompt: "Calculate 50 factorial (50!). Save the result to factorial.txt along with the number of digits in the result.",
    category: "computation",
    difficulty: "medium",
    expectedOutputType: "file",
    verificationCriteria: [
      "File factorial.txt exists",
      "Contains correct value of 50!",
      "Shows digit count (65 digits)",
      "No overflow errors"
    ]
  }
];

export interface BenchmarkResult {
  taskId: string;
  success: boolean;
  executionTimeMs: number;
  iterations: number;
  cognitiveMetrics?: {
    stability: number;
    coherence: number;
    embeddingTimeMs: number;
    thinkingTimeMs: number;
    learningTimeMs: number;
  };
  verificationResults: {
    criterion: string;
    passed: boolean;
  }[];
  error?: string;
  artifacts: string[];
}

export interface BenchmarkSummary {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  avgExecutionTimeMs: number;
  avgIterations: number;
  avgStability?: number;
  avgCoherence?: number;
  avgEmbeddingTimeMs?: number;
  avgThinkingTimeMs?: number;
  avgLearningTimeMs?: number;
  results: BenchmarkResult[];
}
