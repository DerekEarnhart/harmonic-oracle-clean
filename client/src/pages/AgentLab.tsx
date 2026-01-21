import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { OracleChat } from "@/components/OracleChat";
import { getLoginUrl } from "@/const";
import { FlaskConical, Sparkles } from "lucide-react";

export default function AgentLab() {
  const { isAuthenticated } = useAuth();

  // Allow access in demo mode (when OAuth is not configured)
  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <Card className="max-w-md">
  //         <CardContent className="pt-6 text-center space-y-4">
  //           <FlaskConical className="h-12 w-12 mx-auto text-primary" />
  //           <h2 className="text-xl font-semibold">Agent Laboratory</h2>
  //           <p className="text-sm text-muted-foreground">
  //             Login to run agentic workflows with execution traces, steps, and artifacts.
  //           </p>
  //           <Button asChild className="w-full">
  //             <a href={getLoginUrl()}>
  //               <Sparkles className="mr-2 h-4 w-4" />
  //               Login
  //             </a>
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <AppShell
      title="Agent Laboratory"
      subtitle="Verifier-first execution • steps • metrics • artifacts"
    >
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Tip: ask for a repo-level task (bug fix, feature, refactor). The Oracle will run tools,
            record steps, and produce artifacts you can download from History.
          </div>
        </div>

        <OracleChat />
      </div>
    </AppShell>
  );
}
