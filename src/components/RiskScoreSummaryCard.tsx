import { Link } from "react-router-dom";
import { useRiskScores } from "@/hooks/useRiskScores";
import { RISK_CONFIG } from "./relapse-risk/types";
import type { RiskLevel } from "./relapse-risk/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function MiniSparkline({ scores, color }: { scores: number[]; color: string }) {
  if (scores.length < 2) return null;
  const max = Math.max(...scores, 20);
  const len = scores.length;
  const points = scores.map((s, i) => {
    const x = (i / (len - 1)) * 56 + 2;
    const y = 18 - (s / max) * 14;
    return `${x},${y}`;
  });

  // Area fill
  const firstX = points[0].split(",")[0];
  const lastX = points[len - 1].split(",")[0];
  const areaPoints = [...points, `${lastX},19`, `${firstX},19`].join(" ");

  return (
    <svg viewBox="0 0 60 20" className="h-5 w-14 flex-shrink-0" preserveAspectRatio="none">
      <defs>
        <linearGradient id="miniSparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#miniSparkFill)" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={parseFloat(points[len - 1].split(",")[0])}
        cy={parseFloat(points[len - 1].split(",")[1])}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function DeltaIndicator({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>0</span>
      </span>
    );
  }

  const isUp = delta > 0;
  const absDelta = Math.abs(delta);
  // Bar width: scale 1-30 delta to 8-28px
  const barWidth = Math.min(28, Math.max(8, (absDelta / 30) * 28));

  return (
    <span className={`inline-flex items-center gap-1 ${isUp ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span className="text-[10px] font-bold">{isUp ? "+" : ""}{delta}</span>
      <span
        className={`h-1.5 rounded-full ${isUp ? "bg-red-500/60 dark:bg-red-400/50" : "bg-emerald-500/60 dark:bg-emerald-400/50"}`}
        style={{ width: `${barWidth}px` }}
      />
    </span>
  );
}

export default function RiskScoreSummaryCard() {
  const { data: scores, isLoading } = useRiskScores(6);

  if (isLoading || !scores || scores.length === 0) return null;

  const latest = scores[scores.length - 1];
  const prev = scores.length >= 2 ? scores[scores.length - 2] : null;
  const cfg = RISK_CONFIG[latest.level as RiskLevel];
  const Icon = cfg.icon;
  const delta = prev ? latest.score - prev.score : null;

  const strokeColor =
    latest.score >= 60 ? "hsl(0, 72%, 51%)" :
    latest.score >= 35 ? "hsl(25, 85%, 50%)" :
    latest.score >= 15 ? "hsl(35, 80%, 50%)" : "hsl(145, 45%, 45%)";

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
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">
            {latest.score}/100
          </span>
          {delta !== null && <DeltaIndicator delta={delta} />}
        </div>
      </div>
      {scores.length >= 2 && (
        <MiniSparkline scores={scores.map((s) => s.score)} color={strokeColor} />
      )}
      <span className="text-[10px] text-muted-foreground">→</span>
    </Link>
  );
}
