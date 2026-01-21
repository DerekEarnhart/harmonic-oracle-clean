import { cn } from "@/lib/utils";
import { CognitiveMetrics } from "./CognitiveMetrics";
import { 
  Terminal, 
  FileText, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface ExecutionStep {
  stepNumber: number;
  thought: string;
  action: string;
  result: string;
  stability: number;
  coherence: number;
  confidence: number;
}

interface ExecutionProgressProps {
  status: "pending" | "running" | "completed" | "failed";
  currentIteration: number;
  currentAction?: string;
  currentThought?: string;
  steps: ExecutionStep[];
  metrics?: {
    stability: number;
    coherence: number;
    confidence: number;
  };
  className?: string;
}

const actionIcons: Record<string, React.ElementType> = {
  shell: Terminal,
  write_file: FileText,
  read_file: FileText,
  harmonic_analyze: Brain,
  complete: CheckCircle2,
};

export function ExecutionProgress({
  status,
  currentIteration,
  currentAction,
  currentThought,
  steps,
  metrics,
  className,
}: ExecutionProgressProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "running" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {status === "completed" && (
            <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.22_145)]" />
          )}
          {status === "failed" && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          {status === "pending" && (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
          )}
          <span className="font-medium capitalize">{status}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Iteration {currentIteration}
        </span>
      </div>

      {/* Current Action */}
      {status === "running" && currentAction && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            {(() => {
              const Icon = actionIcons[currentAction] || Brain;
              return <Icon className="h-4 w-4" />;
            })()}
            <span>Executing: {currentAction}</span>
          </div>
          {currentThought && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {currentThought}
            </p>
          )}
        </div>
      )}

      {/* Cognitive Metrics */}
      {metrics && (
        <div className="rounded-lg border bg-card p-3">
          <h4 className="mb-2 text-sm font-medium">Cognitive State</h4>
          <CognitiveMetrics
            stability={metrics.stability}
            coherence={metrics.coherence}
            confidence={metrics.confidence}
            size="sm"
          />
        </div>
      )}

      {/* Execution Steps */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Execution Steps</h4>
          <div className="space-y-1">
            {steps.map((step) => {
              const Icon = actionIcons[step.action] || Brain;
              const isExpanded = expandedSteps.has(step.stepNumber);

              return (
                <div
                  key={step.stepNumber}
                  className="rounded-lg border bg-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleStep(step.stepNumber)}
                    className="flex w-full items-center gap-2 p-2 text-left hover:bg-muted/50"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs font-mono text-muted-foreground">
                      #{step.stepNumber}
                    </span>
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{step.action}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(step.confidence * 100).toFixed(0)}% conf
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-3 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Thought:
                        </span>
                        <p className="text-sm mt-1">{step.thought}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Result:
                        </span>
                        <pre className="mt-1 text-xs bg-background rounded p-2 overflow-x-auto">
                          {step.result}
                        </pre>
                      </div>
                      <div className="pt-2 border-t">
                        <CognitiveMetrics
                          stability={step.stability}
                          coherence={step.coherence}
                          confidence={step.confidence}
                          size="sm"
                          showLabels={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
