import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Code2, Copy, Download, Loader2, Sparkles } from "lucide-react";

function codeOnlyPrompt(request: string) {
  return [
    "You are a code synthesis engine.",
    "Output ONLY the code. No markdown fences. No commentary.",
    "If multiple files are needed, output a unified diff (git patch) instead of prose.",
    "",
    "Request:",
    request.trim(),
  ].join("\n");
}

export default function CodeSynthesis() {
  const { isAuthenticated } = useAuth();
  const [request, setRequest] = useState(
    "Write a TypeScript function that debounces an async callback. Include unit tests."
  );
  const [output, setOutput] = useState("");
  const [activeExecutionId, setActiveExecutionId] = useState<number | null>(null);

  const submitTask = trpc.oracle.submitTask.useMutation();
  const { data: executionData } = trpc.oracle.getExecution.useQuery(
    { executionId: activeExecutionId! },
    {
      enabled: activeExecutionId !== null,
      refetchInterval: activeExecutionId ? 2000 : false,
    }
  );

  useEffect(() => {
    if (!executionData?.execution) return;
    const exec = executionData.execution;
    if (exec.finalResult) setOutput(exec.finalResult);
    if (exec.status === "failed" && exec.errorMessage) {
      setOutput(`// ERROR\n// ${exec.errorMessage}\n`);
    }
  }, [executionData]);

  const isRunning = useMemo(() => {
    const s = executionData?.execution?.status;
    return s === "running" || s === "pending";
  }, [executionData]);

  async function run() {
    setOutput("");
    const res = await submitTask.mutateAsync({
      taskPrompt: codeOnlyPrompt(request),
      cognitiveMode: "analytical",
    });
    setActiveExecutionId(res.executionId);
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(output);
  }

  function downloadText() {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synthesis.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Only show login prompt if OAuth is configured
  if (!isAuthenticated && isOAuthConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Code2 className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Code Synthesis</h2>
            <p className="text-sm text-muted-foreground">
              Login to generate code using the Oracle execution engine.
            </p>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Login
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell title="Code Synthesis Engine" subtitle="Fast code-only generation (diff-friendly)">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">
              Ask for a snippet or a full patch. If the request requires multiple files, the Oracle will
              return a unified diff.
            </div>
          </div>

          <Textarea
            className="min-h-[180px]"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <Button onClick={() => void run()} disabled={submitTask.isPending || !request.trim()}>
              {submitTask.isPending || isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Generate
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              Output is polled every ~2s while the run is active.
            </div>
          </div>

          {executionData?.steps?.length ? (
            <div className="rounded-xl border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-2">Latest step</div>
              <div className="text-sm font-medium">
                {executionData.steps[executionData.steps.length - 1]?.action || "Working..."}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Output</div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => void copyToClipboard()} disabled={!output}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button variant="secondary" size="sm" onClick={downloadText} disabled={!output}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 min-h-[420px] overflow-auto">
            <pre className="text-sm whitespace-pre-wrap">{output || "Output will appear here."}</pre>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
