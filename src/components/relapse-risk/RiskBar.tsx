import { RiskLevel } from "./types";

const BAR_COLORS: Record<RiskLevel, string> = {
  low: "bg-emerald-500",
  moderate: "bg-amber-500",
  elevated: "bg-orange-500",
  high: "bg-red-500",
};

interface RiskBarProps {
  level: RiskLevel;
  score: number;
}

const TEXT_COLORS: Record<RiskLevel, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  moderate: "text-amber-600 dark:text-amber-400",
  elevated: "text-orange-600 dark:text-orange-400",
  high: "text-red-600 dark:text-red-400",
};

export default function RiskBar({ level, score }: RiskBarProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${BAR_COLORS[level]} transition-all duration-500`}
          style={{ width: `${Math.max(5, score)}%` }}
        />
      </div>
      <span className={`text-[11px] font-bold tabular-nums ${TEXT_COLORS[level]}`}>
        {score}/100
      </span>
    </div>
  );
}
