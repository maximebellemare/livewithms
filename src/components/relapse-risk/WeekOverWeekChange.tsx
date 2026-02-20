import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { RiskResult } from "./types";

interface WeekOverWeekChangeProps {
  risk: RiskResult;
  prevRisk: RiskResult;
}

export default function WeekOverWeekChange({ risk, prevRisk }: WeekOverWeekChangeProps) {
  const diff = risk.score - prevRisk.score;

  return (
    <div className="flex items-center gap-1.5 mb-2 text-[11px]">
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
  );
}
