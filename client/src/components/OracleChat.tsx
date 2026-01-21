import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CognitiveModeSelector, CognitiveMode, CognitiveModeBadge } from "./CognitiveModeSelector";
import { CognitiveMetrics } from "./CognitiveMetrics";
import { ExecutionProgress } from "./ExecutionProgress";
import { Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "oracle";
  content: string;
  timestamp: Date;
  executionId?: number;
  cognitiveMode?: CognitiveMode;
  status?: "pending" | "running" | "completed" | "failed";
  metrics?: {
    stability: number;
    coherence: number;
    confidence: number;
  };
  iterations?: number;
  executionTimeMs?: number;
}

export function OracleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [cognitiveMode, setCognitiveMode] = useState<CognitiveMode>("balanced");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeExecutionId, setActiveExecutionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const submitTask = trpc.oracle.submitTask.useMutation();
  const { data: executionData, refetch: refetchExecution } = trpc.oracle.getExecution.useQuery(
    { executionId: activeExecutionId! },
    { 
      enabled: activeExecutionId !== null,
      refetchInterval: activeExecutionId ? 2000 : false,
    }
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update message when execution data changes
  useEffect(() => {
    if (executionData?.execution && activeExecutionId) {
      const exec = executionData.execution;
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.executionId === activeExecutionId
            ? {
                ...msg,
                status: exec.status as Message["status"],
                content: exec.finalResult || "Processing...",
                metrics: exec.finalStability
                  ? {
                      stability: exec.finalStability,
                      coherence: exec.finalCoherence || 0,
                      confidence: exec.finalConfidence || 0,
                    }
                  : undefined,
                iterations: exec.iterations || 0,
                executionTimeMs: exec.executionTimeMs || undefined,
              }
            : msg
        )
      );

      // Stop polling when completed or failed
      if (exec.status === "completed" || exec.status === "failed") {
        setActiveExecutionId(null);
        setIsSubmitting(false);
      }
    }
  }, [executionData, activeExecutionId]);

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      cognitiveMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSubmitting(true);

    try {
      const result = await submitTask.mutateAsync({
        taskPrompt: input.trim(),
        cognitiveMode,
      });

      const oracleMessage: Message = {
        id: `oracle-${result.executionId}`,
        role: "oracle",
        content: "Initializing harmonic cognitive framework...",
        timestamp: new Date(),
        executionId: result.executionId,
        cognitiveMode,
        status: "running",
      };

      setMessages((prev) => [...prev, oracleMessage]);
      setActiveExecutionId(result.executionId);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "oracle",
        content: `Error: ${error instanceof Error ? error.message : "Failed to submit task"}`,
        timestamp: new Date(),
        status: "failed",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Harmonic Oracle</h2>
            <p className="text-muted-foreground max-w-md">
              Submit a task in natural language and watch the Oracle execute it
              autonomously using quantum-inspired cognitive reasoning.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <Card
              className={cn(
                "max-w-[80%]",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card"
              )}
            >
              <CardContent className="p-3">
                {message.role === "user" ? (
                  <div>
                    <p className="text-sm">{message.content}</p>
                    {message.cognitiveMode && (
                      <div className="mt-2 flex justify-end">
                        <CognitiveModeBadge mode={message.cognitiveMode} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {message.status === "running" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}

                    <div className="prose prose-sm prose-invert max-w-none">
                      <Streamdown>{message.content}</Streamdown>
                    </div>

                    {message.metrics && (
                      <div className="pt-3 border-t border-border">
                        <CognitiveMetrics
                          stability={message.metrics.stability}
                          coherence={message.metrics.coherence}
                          confidence={message.metrics.confidence}
                          size="sm"
                        />
                      </div>
                    )}

                    {message.status === "completed" && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        <span>{message.iterations} iterations</span>
                        {message.executionTimeMs && (
                          <span>{(message.executionTimeMs / 1000).toFixed(2)}s</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Execution Details */}
        {activeExecutionId && executionData?.steps && executionData.steps.length > 0 && (
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Execution Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ExecutionProgress
                status={executionData.execution?.status as "pending" | "running" | "completed" | "failed" || "running"}
                currentIteration={executionData.steps.length}
                currentAction={executionData.steps[executionData.steps.length - 1]?.action || undefined}
                currentThought={executionData.steps[executionData.steps.length - 1]?.thought || undefined}
                steps={executionData.steps.map((s) => ({
                  stepNumber: s.stepNumber,
                  thought: s.thought || "",
                  action: s.action || "",
                  result: s.result || "",
                  stability: s.stability || 0,
                  coherence: s.coherence || 0,
                  confidence: s.confidence || 0,
                }))}
                metrics={
                  executionData.execution?.finalStability
                    ? {
                        stability: executionData.execution.finalStability,
                        coherence: executionData.execution.finalCoherence || 0,
                        confidence: executionData.execution.finalConfidence || 0,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-card p-4 space-y-3">
        <CognitiveModeSelector
          value={cognitiveMode}
          onChange={setCognitiveMode}
          disabled={isSubmitting}
        />

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your task... (e.g., 'Create a Python script that calculates fibonacci numbers')"
            className="min-h-[60px] resize-none"
            disabled={isSubmitting}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isSubmitting}
            className="h-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
