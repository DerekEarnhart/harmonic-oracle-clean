import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { 
  Sparkles, 
  ArrowLeft,
  BarChart3,
  Clock,
  Repeat,
  CheckCircle2,
  Zap,
  Brain,
  BookOpen
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from "recharts";

const COLORS = {
  basic: "oklch(0.55 0.15 250)",
  harmonicBalanced: "oklch(0.55 0.22 160)",
  harmonicAnalytical: "oklch(0.60 0.20 300)",
};

export default function Benchmarks() {
  const { data: comparison } = trpc.benchmark.getComparison.useQuery();

  const successRateData = comparison?.successRates.map((item) => ({
    name: item.name,
    value: item.value,
    fill: item.name.includes("Basic") 
      ? COLORS.basic 
      : item.name.includes("Balanced") 
        ? COLORS.harmonicBalanced 
        : COLORS.harmonicAnalytical,
  })) || [];

  const executionTimeData = comparison?.executionTimes || [];
  const iterationsData = comparison?.iterations || [];

  return (
    <AppShell title="Benchmarks" subtitle="Performance metrics and progress">
      <main className="container py-8 space-y-8">
        {/* Hero Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[oklch(0.55_0.22_160/0.2)] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.65_0.22_160)]" />
                </div>
                <div>
                  <div className="text-2xl font-bold">—</div>
                  <div className="text-xs text-muted-foreground">Harmonic Success</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">—</div>
                  <div className="text-xs text-muted-foreground">Avg Execution</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[oklch(0.60_0.20_300/0.2)] flex items-center justify-center">
                  <Repeat className="h-5 w-5 text-[oklch(0.70_0.20_300)]" />
                </div>
                <div>
                  <div className="text-2xl font-bold">—</div>
                  <div className="text-xs text-muted-foreground">Avg Iterations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[oklch(0.65_0.18_80/0.2)] flex items-center justify-center">
                  <Zap className="h-5 w-5 text-[oklch(0.75_0.18_80)]" />
                </div>
                <div>
                  <div className="text-2xl font-bold">—</div>
                  <div className="text-xs text-muted-foreground">Core Processing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Success Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[oklch(0.55_0.22_160)]" />
                Success Rate Comparison
              </CardTitle>
              <CardDescription>
                Task completion success rate across 15 test scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={successRateData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                    <XAxis type="number" domain={[0, 100]} stroke="oklch(0.65 0.02 260)" />
                    <YAxis dataKey="name" type="category" width={120} stroke="oklch(0.65 0.02 260)" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "oklch(0.16 0.02 260)", 
                        border: "1px solid oklch(0.28 0.02 260)",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Success Rate"]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {successRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Execution Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Execution Time
              </CardTitle>
              <CardDescription>
                Average time to complete tasks (seconds)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={executionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                    <XAxis dataKey="name" stroke="oklch(0.65 0.02 260)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="oklch(0.65 0.02 260)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "oklch(0.16 0.02 260)", 
                        border: "1px solid oklch(0.28 0.02 260)",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}s`, "Avg Time"]}
                    />
                    <Bar dataKey="value" fill="oklch(0.65 0.18 250)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Iterations Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-[oklch(0.60_0.20_300)]" />
                Average Iterations
              </CardTitle>
              <CardDescription>
                Number of reasoning steps per task
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={iterationsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                    <XAxis dataKey="name" stroke="oklch(0.65 0.02 260)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="oklch(0.65 0.02 260)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "oklch(0.16 0.02 260)", 
                        border: "1px solid oklch(0.28 0.02 260)",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [value.toFixed(1), "Iterations"]}
                    />
                    <Bar dataKey="value" fill="oklch(0.60 0.20 300)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Core Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-[oklch(0.65_0.18_80)]" />
                Harmonic Agent Core Performance
              </CardTitle>
              <CardDescription>
                Quantum-inspired cognitive operation timings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparison?.corePerformance && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Embedding</div>
                        <div className="text-xs text-muted-foreground">Text to cognitive perturbation</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold font-mono">
                          {comparison.corePerformance.embedding.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">ms</div>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Thinking (50 steps)</div>
                        <div className="text-xs text-muted-foreground">Lindblad evolution dynamics</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold font-mono">
                          {comparison.corePerformance.thinking.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">ms</div>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Learning</div>
                        <div className="text-xs text-muted-foreground">Belief state update</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold font-mono">
                          {comparison.corePerformance.learning.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">ms</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.55_0.22_145)] mt-0.5" />
                  <div>
                    <div className="font-medium">Higher Reliability</div>
                    <p className="text-sm text-muted-foreground">
                      Quantum-inspired cognitive framework improves task completion reliability
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.55_0.22_145)] mt-0.5" />
                  <div>
                    <div className="font-medium">Better Error Recovery</div>
                    <p className="text-sm text-muted-foreground">
                      Handles edge cases that Basic Oracle misses through cognitive interrogation
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.55_0.22_145)] mt-0.5" />
                  <div>
                    <div className="font-medium">Minimal Overhead</div>
                    <p className="text-sm text-muted-foreground">
                      Core harmonic operations maintain efficient cognitive processing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.55_0.22_145)] mt-0.5" />
                  <div>
                    <div className="font-medium">Cognitive Stability</div>
                    <p className="text-sm text-muted-foreground">
                      Maintains stable belief states across diverse task types
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
