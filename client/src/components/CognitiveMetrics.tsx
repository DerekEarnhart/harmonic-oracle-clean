import { cn } from "@/lib/utils";

interface CognitiveMetricsProps {
  stability: number;
  coherence: number;
  confidence: number;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CognitiveMetrics({
  stability,
  coherence,
  confidence,
  showLabels = true,
  size = "md",
  className,
}: CognitiveMetricsProps) {
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const labelSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const metrics = [
    {
      name: "Stability",
      value: stability,
      color: "bg-[oklch(0.55_0.22_160)]",
      description: "Cognitive equilibrium state",
    },
    {
      name: "Coherence",
      value: coherence,
      color: "bg-[oklch(0.65_0.18_250)]",
      description: "Information integration level",
    },
    {
      name: "Confidence",
      value: confidence,
      color: "bg-[oklch(0.60_0.20_300)]",
      description: "Decision certainty",
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {metrics.map((metric) => (
        <div key={metric.name} className="space-y-1">
          {showLabels && (
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", labelSizes[size])}>
                {metric.name}
              </span>
              <span className={cn("font-mono text-muted-foreground", labelSizes[size])}>
                {(metric.value * 100).toFixed(1)}%
              </span>
            </div>
          )}
          <div className={cn("relative overflow-hidden rounded-full bg-muted", sizeClasses[size])}>
            <div
              className={cn("absolute left-0 top-0 h-full transition-all duration-500 ease-out rounded-full", metric.color)}
              style={{ width: `${Math.min(100, metric.value * 100)}%` }}
            />
          </div>
          {showLabels && size === "lg" && (
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

interface MetricBadgeProps {
  label: string;
  value: number;
  type: "stability" | "coherence" | "confidence";
  className?: string;
}

export function MetricBadge({ label, value, type, className }: MetricBadgeProps) {
  const colors = {
    stability: "bg-[oklch(0.55_0.22_160/0.2)] text-[oklch(0.65_0.22_160)]",
    coherence: "bg-[oklch(0.65_0.18_250/0.2)] text-[oklch(0.75_0.18_250)]",
    confidence: "bg-[oklch(0.60_0.20_300/0.2)] text-[oklch(0.70_0.20_300)]",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1", colors[type], className)}>
      <span className="text-xs font-medium">{label}</span>
      <span className="font-mono text-xs">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
