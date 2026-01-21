import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import History from "./pages/History";
import Benchmarks from "./pages/Benchmarks";
import AgentLab from "./pages/AgentLab";
import CodeSynthesis from "./pages/CodeSynthesis";
import ArcMetaLearner from "./pages/ArcMetaLearner";
import SystemCodex from "./pages/SystemCodex";
import Artifacts from "./pages/Artifacts";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/history" component={History} />
      <Route path="/benchmarks" component={Benchmarks} />
      <Route path="/lab/agent" component={AgentLab} />
      <Route path="/lab/synthesis" component={CodeSynthesis} />
      <Route path="/lab/arc" component={ArcMetaLearner} />
      <Route path="/codex" component={SystemCodex} />
      <Route path="/artifacts" component={Artifacts} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
