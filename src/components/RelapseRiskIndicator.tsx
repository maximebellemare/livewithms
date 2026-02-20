import { useMemo } from "react";
import { useEntriesInRange, DailyEntry } from "@/hooks/useEntries";
import { format, subDays } from "date-fns";
import { AlertTriangle, Shield, ShieldAlert, TrendingUp } from "lucide-react";

type RiskLevel = "low" | "moderate" | "elevated" | "high";

interface RiskResult {
  level: RiskLevel;
  score: number; // 0-100
  factors: string[];
}

function avg(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => typeof x === "number");
  return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function trend(recent: (number | null | undefined)[], older: (number | null | undefined)[]): number | null {
  const r = avg(recent);
  const o = avg(older);
  if (r === null || o === null) return null;
  return r - o;
}

function computeRisk(recent: DailyEntry[], older: DailyEntry[]): RiskResult {
  const factors: string[] = [];
  let score = 0;

  // Symptom keys where higher = worse
  const worseHigher: { key: keyof DailyEntry; label: string; weight: number }[] = [
    { key: "fatigue", label: "Fatigue", weight: 15 },
    { key: "pain", label: "Pain", weight: 12 },
    { key: "brain_fog", label: "Brain fog", weight: 10 },
    { key: "spasticity", label: "Spasticity", weight: 12 },
    { key: "stress", label: "Stress", weight: 10 },
  ];

  // Keys where higher = better (declining is bad)
  const betterHigher: { key: keyof DailyEntry; label: string; weight: number }[] = [
    { key: "mood", label: "Mood", weight: 8 },
    { key: "mobility", label: "Mobility", weight: 10 },
  ];

  for (const { key, label, weight } of worseHigher) {
    const t = trend(
      recent.map((e) => e[key] as number | null),
      older.map((e) => e[key] as number | null)
    );
    if (t !== null && t > 1) {
      const contribution = Math.min(weight, (t / 3) * weight);
      score += contribution;
      factors.push(`${label} trending up (+${t.toFixed(1)})`);
    }
    // Also flag if recent absolute values are high
    const recentAvg = avg(recent.map((e) => e[key] as number | null));
    if (recentAvg !== null && recentAvg >= 7) {
      score += weight * 0.4;
      factors.push(`${label} consistently high (${recentAvg.toFixed(1)}/10)`);
    }
  }

  for (const { key, label, weight } of betterHigher) {
    const t = trend(
      recent.map((e) => e[key] as number | null),
      older.map((e) => e[key] as number | null)
    );
    if (t !== null && t < -1) {
      const contribution = Math.min(weight, (Math.abs(t) / 3) * weight);
      score += contribution;
      factors.push(`${label} declining (${t.toFixed(1)})`);
    }
  }

  // Sleep factor
  const recentSleep = avg(recent.map((e) => e.sleep_hours));
  const olderSleep = avg(older.map((e) => e.sleep_hours));
  if (recentSleep !== null && recentSleep < 6) {
    score += 8;
    factors.push(`Sleep low (${recentSleep.toFixed(1)} hrs)`);
  } else if (recentSleep !== null && olderSleep !== null && recentSleep < olderSleep - 1) {
    score += 5;
    factors.push(`Sleep declining`);
  }

  // Multiple symptoms worsening simultaneously is compounding
  const worseningCount = factors.filter((f) => f.includes("trending") || f.includes("declining")).length;
  if (worseningCount >= 3) {
    score += 10;
  }

  score = Math.min(100, Math.round(score));

  // Deduplicate factors (keep max 4)
  const unique = [...new Set(factors)].slice(0, 4);

  const level: RiskLevel =
    score >= 60 ? "high" :
    score >= 35 ? "elevated" :
    score >= 15 ? "moderate" : "low";

  return { level, score, factors: unique };
}

const CONFIG: Record<RiskLevel, { icon: typeof Shield; color: string; bg: string; border: string; label: string; emoji: string }> = {
  low: {
    icon: Shield,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Low Risk",
    emoji: "🛡️",
  },
  moderate: {
    icon: Shield,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    label: "Moderate",
    emoji: "⚠️",
  },
  elevated: {
    icon: ShieldAlert,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    label: "Elevated",
    emoji: "🔶",
  },
  high: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    label: "High Risk",
    emoji: "🔴",
  },
};

export default function RelapseRiskIndicator() {
  const today = new Date();
  const start = format(subDays(today, 13), "yyyy-MM-dd");
  const end = format(today, "yyyy-MM-dd");
  const { data: entries = [], isLoading } = useEntriesInRange(start, end);

  const risk = useMemo(() => {
    if (entries.length < 4) return null;

    const midpoint = format(subDays(today, 6), "yyyy-MM-dd");
    const recent = entries.filter((e) => e.date > midpoint);
    const older = entries.filter((e) => e.date <= midpoint);

    if (recent.length < 2 || older.length < 2) return null;
    return computeRisk(recent, older);
  }, [entries]);

  if (isLoading || !risk) return null;

  const cfg = CONFIG[risk.level];
  const Icon = cfg.icon;

  // Bar color
  const barColor =
    risk.level === "low" ? "bg-emerald-500" :
    risk.level === "moderate" ? "bg-amber-500" :
    risk.level === "elevated" ? "bg-orange-500" : "bg-red-500";

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 animate-fade-in`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${cfg.color}`} />
        <span className="text-sm font-semibold text-foreground">Relapse Risk</span>
        <span className={`ml-auto text-xs font-bold ${cfg.color}`}>
          {cfg.emoji} {cfg.label}
        </span>
      </div>

      {/* Risk bar */}
      <div className="h-1.5 w-full rounded-full bg-muted mb-2">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.max(5, risk.score)}%` }}
        />
      </div>

      {/* Factors */}
      {risk.factors.length > 0 && (
        <div className="space-y-0.5">
          {risk.factors.map((f, i) => (
            <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5 flex-shrink-0" />
              {f}
            </p>
          ))}
        </div>
      )}

      {risk.level === "low" && risk.factors.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Your symptoms are stable — keep it up! 💪
        </p>
      )}

      <p className="mt-2 text-[9px] text-muted-foreground">
        Based on 14-day trends · not medical advice
      </p>
    </div>
  );
}

