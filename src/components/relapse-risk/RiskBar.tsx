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

export default function RiskBar({ level, score }: RiskBarProps) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted mb-2">
      <div
        className={`h-full rounded-full ${BAR_COLORS[level]} transition-all duration-500`}
        style={{ width: `${Math.max(5, score)}%` }}
      />
    </div>
  );
}
