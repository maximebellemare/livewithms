import { TrendingUp } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const METRIC_EXPLANATIONS: Record<string, string> = {
  fatigue: "How physically and mentally drained you feel. Rising fatigue can signal increased disease activity.",
  pain: "General pain levels including headaches, nerve pain, or muscle aches. Persistent increases may indicate a flare.",
  "brain fog": "Difficulty concentrating, memory issues, or mental clarity problems — a common MS cognitive symptom.",
  mobility: "Your ease of movement and balance. A declining score suggests worsening motor function.",
  spasticity: "Muscle stiffness or involuntary spasms. Increasing spasticity can precede a relapse.",
  mood: "Emotional well-being and outlook. Dropping mood may reflect both psychological and neurological changes.",
  stress: "Perceived stress levels. High stress is a known trigger that can worsen MS symptoms.",
  sleep: "Sleep quality and duration. Poor sleep often amplifies fatigue and cognitive symptoms.",
};

function getExplanation(factor: string): string {
  const lower = factor.toLowerCase();
  for (const [key, explanation] of Object.entries(METRIC_EXPLANATIONS)) {
    if (lower.includes(key)) return explanation;
  }
  return "This symptom showed a notable increase compared to the previous week.";
}

interface RiskFactorsProps {
  factors: string[];
  isLow: boolean;
}

export default function RiskFactors({ factors, isLow }: RiskFactorsProps) {
  if (factors.length > 0) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="space-y-0.5">
          {factors.map((f, i) => (
            <UITooltip key={i}>
              <TooltipTrigger asChild>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 cursor-help">
                  <TrendingUp className="h-2.5 w-2.5 flex-shrink-0" />
                  {f}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[240px]">
                {getExplanation(f)}
              </TooltipContent>
            </UITooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  if (isLow) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Your symptoms are stable — keep it up! 💪
      </p>
    );
  }

  return null;
}
