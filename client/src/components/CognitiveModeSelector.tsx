import { cn } from "@/lib/utils";
import { Brain, Lightbulb, Shield, Sparkles } from "lucide-react";

export type CognitiveMode = "balanced" | "analytical" | "creative" | "cautious";

interface CognitiveModeSelectorProps {
  value: CognitiveMode;
  onChange: (mode: CognitiveMode) => void;
  disabled?: boolean;
  className?: string;
}

const modes: {
  id: CognitiveMode;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: "balanced",
    name: "Balanced",
    description: "Standard operation with moderate caution",
    icon: Brain,
    color: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30",
  },
  {
    id: "analytical",
    name: "Analytical",
    description: "Deep analysis, slower, more focused",
    icon: Lightbulb,
    color: "bg-[oklch(0.65_0.18_250/0.2)] text-[oklch(0.75_0.18_250)] border-[oklch(0.65_0.18_250/0.3)] hover:bg-[oklch(0.65_0.18_250/0.3)]",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Exploratory, faster adaptation",
    icon: Sparkles,
    color: "bg-[oklch(0.60_0.20_300/0.2)] text-[oklch(0.70_0.20_300)] border-[oklch(0.60_0.20_300/0.3)] hover:bg-[oklch(0.60_0.20_300/0.3)]",
  },
  {
    id: "cautious",
    name: "Cautious",
    description: "High interrogation, minimal learning",
    icon: Shield,
    color: "bg-[oklch(0.65_0.18_80/0.2)] text-[oklch(0.75_0.18_80)] border-[oklch(0.65_0.18_80/0.3)] hover:bg-[oklch(0.65_0.18_80/0.3)]",
  },
];

export function CognitiveModeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: CognitiveModeSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = value === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
              isSelected
                ? cn(mode.color, "border-2")
                : "border-border bg-card hover:bg-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="font-medium text-sm">{mode.name}</span>
            </div>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {mode.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CognitiveModeBadge({
  mode,
  className,
}: {
  mode: CognitiveMode;
  className?: string;
}) {
  const modeConfig = modes.find((m) => m.id === mode)!;
  const Icon = modeConfig.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        modeConfig.color.split(" ").slice(0, 2).join(" "),
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{modeConfig.name}</span>
    </div>
  );
}
