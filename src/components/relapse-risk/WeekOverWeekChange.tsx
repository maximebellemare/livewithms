import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RiskResult } from "./types";

interface WeekOverWeekChangeProps {
  risk: RiskResult;
  prevRisk: RiskResult;
}

export default function WeekOverWeekChange({ risk, prevRisk }: WeekOverWeekChangeProps) {
  const diff = risk.score - prevRisk.score;

  return (
    <TooltipProvider delayDuration={200}>
      <UITooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] cursor-help">
            {diff > 0 ? (
              <>
                <ArrowUp className="h-3 w-3 text-red-500 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  +{diff} pts vs last week
                </span>
              </>
            ) : diff < 0 ? (
              <>
                <ArrowDown className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {diff} pts vs last week
                </span>
              </>
            ) : (
              <>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">
                  No change vs last week
                </span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[220px]">
          {diff > 0
            ? "Your risk score increased since last week — symptoms may be worsening."
            : diff < 0
            ? "Your risk score dropped since last week — symptoms are improving."
            : "Your risk score is unchanged from last week."}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}
