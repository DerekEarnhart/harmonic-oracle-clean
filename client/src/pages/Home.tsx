import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { OracleChat } from "@/components/OracleChat";
import { AppShell } from "@/components/AppShell";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  Sparkles, 
  History, 
  BarChart3, 
  LogIn, 
  LogOut,
  Brain,
  Zap,
  Shield,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Brain className="h-6 w-6 animate-pulse" />
          <span>Initializing Oracle...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-[oklch(0.55_0.22_160/0.1)]" />
          <div className="container relative py-24 lg:py-32">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">Quantum-Inspired Autonomous Execution</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                Harmonic Oracle
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Eliminate hands-on computer work with autonomous task execution. 
                Powered by LLM reasoning and a quantum-inspired cognitive framework 
                that ensures stable, coherent decision-making.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/lab/agent">
                    <LogIn className="mr-2 h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/benchmarks">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Benchmarks
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-xl border bg-card p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Cognitive Framework</h3>
              <p className="text-muted-foreground text-sm">
                KMS equilibrium states and Lindblad dynamics ensure stable reasoning 
                through quantum-inspired cognitive processing.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <div className="h-12 w-12 rounded-lg bg-[oklch(0.55_0.22_160/0.2)] flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[oklch(0.65_0.22_160)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Autonomous Execution</h3>
              <p className="text-muted-foreground text-sm">
                Execute complex tasks through natural language. The Oracle plans, 
                executes, and verifies work autonomously.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <div className="h-12 w-12 rounded-lg bg-[oklch(0.65_0.18_80/0.2)] flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[oklch(0.75_0.18_80)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">High Reliability</h3>
              <p className="text-muted-foreground text-sm">
                Quantum-inspired cognitive framework ensures stable, coherent decision-making 
                with benchmark-verified performance metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Benchmark Preview */}
        <div className="container py-16 border-t">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Benchmark Results</h2>
              <p className="text-muted-foreground">
                Performance metrics will be displayed after benchmark testing
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/benchmarks">
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">—</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-4xl font-bold text-[oklch(0.55_0.22_160)] mb-2">—</div>
              <div className="text-sm text-muted-foreground">Cognitive Processing</div>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="text-4xl font-bold text-[oklch(0.60_0.20_300)] mb-2">—</div>
              <div className="text-sm text-muted-foreground">Avg Iterations</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated view - show chat interface
  return (
    <AppShell title="Oracle" subtitle="Quantum-Inspired Autonomous Execution">
      <OracleChat />
    </AppShell>
  );

}
