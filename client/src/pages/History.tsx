import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CognitiveModeBadge } from "@/components/CognitiveModeSelector";
import { CognitiveMetrics } from "@/components/CognitiveMetrics";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { 
  Sparkles, 
  History as HistoryIcon, 
  BarChart3, 
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function History() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: history, isLoading } = trpc.oracle.getHistory.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const { data: executionDetails } = trpc.oracle.getExecution.useQuery(
    { executionId: selectedId! },
    { enabled: selectedId !== null }
  );

  // Only show sign-in prompt if OAuth is configured
  if (!isAuthenticated && isOAuthConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your task history.
            </p>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.22_145)]" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AppShell title="History" subtitle="Executions, steps, and artifacts">
      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">Recent Tasks</h2>
            
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && (!history || history.length === 0) && (
              <Card>
                <CardContent className="py-8 text-center">
                  <HistoryIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No tasks yet</p>
                  <Button className="mt-4" asChild>
                    <Link href="/">Submit Your First Task</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {history && history.length > 0 && (
              <div className="space-y-2">
                {history.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedId(task.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedId === task.id
                        ? "border-primary bg-primary/10"
                        : "bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {task.taskPrompt}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(task.status)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(task.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Task Details */}
          <div className="lg:col-span-2">
            {!selectedId && (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a task to view details
                  </p>
                </CardContent>
              </Card>
            )}

            {selectedId && executionDetails?.execution && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Task Details</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(
                          new Date(executionDetails.execution.createdAt),
                          "MMMM d, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(executionDetails.execution.status)}
                      <span className="text-sm font-medium capitalize">
                        {executionDetails.execution.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Task Prompt */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Task</h4>
                    <p className="text-sm bg-muted rounded-lg p-3">
                      {executionDetails.execution.taskPrompt}
                    </p>
                  </div>

                  {/* Cognitive Mode */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cognitive Mode</h4>
                    <CognitiveModeBadge
                      mode={executionDetails.execution.cognitiveMode as "balanced" | "analytical" | "creative" | "cautious"}
                    />
                  </div>

                  {/* Metrics */}
                  {executionDetails.execution.finalStability && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Final Cognitive State
                      </h4>
                      <CognitiveMetrics
                        stability={executionDetails.execution.finalStability}
                        coherence={executionDetails.execution.finalCoherence || 0}
                        confidence={executionDetails.execution.finalConfidence || 0}
                        size="md"
                      />
                    </div>
                  )}

                  {/* Execution Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <div className="text-2xl font-bold">
                        {executionDetails.execution.iterations || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Iterations
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-2xl font-bold">
                        {executionDetails.execution.executionTimeMs
                          ? `${(executionDetails.execution.executionTimeMs / 1000).toFixed(2)}s`
                          : "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Execution Time
                      </div>
                    </div>
                  </div>

                  {/* Result */}
                  {executionDetails.execution.finalResult && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Result</h4>
                      <pre className="text-sm bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                        {executionDetails.execution.finalResult}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {executionDetails.execution.errorMessage && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-destructive">
                        Error
                      </h4>
                      <pre className="text-sm bg-destructive/10 text-destructive rounded-lg p-3 overflow-x-auto">
                        {executionDetails.execution.errorMessage}
                      </pre>
                    </div>
                  )}

                  {/* Artifacts */}
                  {executionDetails.execution.artifactUrls && executionDetails.execution.artifactUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Artifacts ({executionDetails.execution.artifactUrls.length})
                      </h4>
                      <ul className="space-y-2">
                        {executionDetails.execution.artifactUrls.map((url: string, idx: number) => {
                          const fileName = url.split('/').pop() || `Artifact ${idx + 1}`;
                          return (
                            <li key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{fileName}</p>
                                <p className="text-xs text-muted-foreground truncate">{url}</p>
                              </div>
                              <a
                                className="text-xs text-primary hover:underline flex-shrink-0"
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Execution Steps */}
                  {executionDetails.steps && executionDetails.steps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Execution Steps ({executionDetails.steps.length})
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {executionDetails.steps.map((step) => (
                          <div
                            key={step.id}
                            className="rounded-lg border bg-muted/30 p-3"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                #{step.stepNumber}
                              </span>
                              <span className="text-sm font-medium">
                                {step.action}
                              </span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {((step.confidence || 0) * 100).toFixed(0)}% conf
                              </span>
                            </div>
                            {step.thought && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {step.thought}
                              </p>
                            )}
                            {step.result && (
                              <pre className="text-xs bg-background rounded p-2 overflow-x-auto max-h-24">
                                {step.result}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
