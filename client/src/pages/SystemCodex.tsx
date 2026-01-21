import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, BookOpenText } from "lucide-react";

export default function SystemCodex() {
  const { user } = useAuth();

  return (
    <AppShell
      title="System Codex"
      subtitle="Architecture, policies, operational guides"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpenText className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold">Living documentation</div>
                <div className="text-sm text-muted-foreground">
                  This is the “operator manual” for Harmonic Oracle: how tools run, how memory is stored,
                  and how to keep the system reproducible. (User: {user?.name || user?.email || "unknown"})
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="architecture">
          <TabsList>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="capsules">Capsules & Retrieval</TabsTrigger>
            <TabsTrigger value="tools">Tool Registry</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="architecture" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Core loop:</span> propose → execute tools →
                  verify → self-heal → finalize.
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Strict action protocol (typed tool calls)</li>
                  <li>Verifier-first execution (tests & runners)</li>
                  <li>Artifacts are first-class outputs</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capsules" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                <div>
                  Capsules are replayable bundles: inputs, tool calls, logs, diffs, and artifacts.
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Warm memory: summaries + embeddings</li>
                  <li>Cold memory: lossless artifacts and logs</li>
                  <li>Retrieval injects only top-K relevant slices</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                <div>
                  Tools are registered with schema, permissions, and a validator/test harness.
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Filesystem read/write</li>
                  <li>Shell/runner execution</li>
                  <li>External API calls (guarded)</li>
                  <li>Artifact storage (S3 + local fallback)</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmarks" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Recommended path
                </div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Harden tool execution + artifacts</li>
                  <li>Enable SWE-bench Lite export mode</li>
                  <li>Track failure categories and patch loop metrics</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
