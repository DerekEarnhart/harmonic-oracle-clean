import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  History as HistoryIcon,
  BarChart3,
  FlaskConical,
  Code2,
  BookOpen,
  Grid3x3,
  FileText,
  LogOut,
} from "lucide-react";
import React from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/", label: "Oracle", icon: Sparkles },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/benchmarks", label: "Benchmarks", icon: BarChart3 },
  { href: "/artifacts", label: "Artifacts", icon: FileText },
  { href: "/lab/agent", label: "Agent Lab", icon: FlaskConical },
  { href: "/lab/synthesis", label: "Code Synthesis", icon: Code2 },
  { href: "/lab/arc", label: "ARC Meta-Learner", icon: Grid3x3 },
  { href: "/codex", label: "System Codex", icon: BookOpen },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:flex w-64 shrink-0">
            <div className="w-full rounded-xl border bg-card p-3">
              <div className="flex items-center gap-2 px-2 py-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div className="font-semibold">Harmonic Oracle</div>
              </div>

              <div className="mt-2 space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location === item.href ||
                    (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Button
                      key={item.href}
                      variant={active ? "secondary" : "ghost"}
                      className={cn("w-full justify-start gap-2", active && "border")}
                      asChild
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 border-t pt-3 px-2">
                <div className="text-xs text-muted-foreground truncate">
                  {user?.name || user?.email}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-start gap-2"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Top bar (mobile + quick nav) */}
            <header className="mb-6 rounded-xl border bg-card">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{title || "Harmonic Oracle"}</div>
                    {subtitle && (
                      <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                  {/* compact nav on mobile */}
                  {NAV.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const active =
                      location === item.href ||
                      (item.href !== "/" && location.startsWith(item.href));
                    return (
                      <Button
                        key={item.href}
                        variant={active ? "secondary" : "ghost"}
                        size="icon"
                        asChild
                      >
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </header>

            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
