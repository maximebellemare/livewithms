import { TrendingUp } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskFactorsProps {
  factors: string[];
  isLow: boolean;
}

export default function RiskFactors({ factors, isLow }: RiskFactorsProps) {
  if (factors.length > 0) {
    return (
      <TooltipProvider delayDuration={200}>
        <UITooltip>
          <TooltipTrigger asChild>
            <div className="space-y-0.5 cursor-help">
              {factors.map((f, i) => (
                <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-2.5 w-2.5 flex-shrink-0" />
                  {f}
                </p>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-[240px]">
            These symptoms showed the biggest increase when comparing the past 7 days to the 7 days before that.
          </TooltipContent>
        </UITooltip>
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
