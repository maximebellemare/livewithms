import { Link } from "react-router-dom";
import { useRiskScores } from "@/hooks/useRiskScores";
import { RISK_CONFIG } from "./relapse-risk/types";
import type { RiskLevel } from "./relapse-risk/types";

export default function RiskScoreSummaryCard() {
  const { data: scores, isLoading } = useRiskScores(4);

  if (isLoading || !scores || scores.length === 0) return null;

  const latest = scores[scores.length - 1];
  const prev = scores.length >= 2 ? scores[scores.length - 2] : null;
  const cfg = RISK_CONFIG[latest.level as RiskLevel];
  const Icon = cfg.icon;
  const delta = prev ? latest.score - prev.score : null;

  return (
    <Link
      to="/risk-history"
      className={`flex items-center gap-3 rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 transition-colors hover:opacity-90`}
    >
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
        <Icon className={`h-4.5 w-4.5 ${cfg.color}`} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">Relapse Risk</span>
          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Score {latest.score}/100
          {delta !== null && delta !== 0 && (
            <span className={delta > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}>
              {" "}({delta > 0 ? "+" : ""}{delta} vs last week)
            </span>
          )}
          {delta === 0 && " (unchanged)"}
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground">→</span>
    </Link>
  );
}
