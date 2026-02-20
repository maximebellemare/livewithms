import { useMemo, useEffect, useRef, useState } from "react";
import { useEntriesInRange, DailyEntry } from "@/hooks/useEntries";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Shield, ShieldAlert, TrendingUp } from "lucide-react";

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

function computeWeeklyScores(entries: DailyEntry[], today: Date): number[] {
  const scores: number[] = [];
  // 4 windows: week 0 (current) through week 3 (oldest)
  for (let w = 0; w < 4; w++) {
    const recentEnd = format(subDays(today, w * 7), "yyyy-MM-dd");
    const recentStart = format(subDays(today, w * 7 + 6), "yyyy-MM-dd");
    const olderEnd = recentStart;
    const olderStart = format(subDays(today, w * 7 + 13), "yyyy-MM-dd");

    const recent = entries.filter((e) => e.date <= recentEnd && e.date > recentStart);
    const older = entries.filter((e) => e.date <= olderEnd && e.date > olderStart);

    if (recent.length >= 2 && older.length >= 2) {
      scores.unshift(computeRisk(recent, older).score);
    }
  }
  return scores;
}

export default function RelapseRiskIndicator() {
  const today = new Date();
  const start = format(subDays(today, 34), "yyyy-MM-dd");
  const end = format(today, "yyyy-MM-dd");
  const { data: entries = [], isLoading } = useEntriesInRange(start, end);

  const { risk, prevRisk, weeklyScores } = useMemo(() => {
    if (entries.length < 4) return { risk: null, prevRisk: null, weeklyScores: [] };

    const midpoint = format(subDays(today, 6), "yyyy-MM-dd");
    const recent = entries.filter((e) => e.date > midpoint);
    const older = entries.filter((e) => e.date <= midpoint && e.date > format(subDays(today, 13), "yyyy-MM-dd"));

    const currentRisk = (recent.length >= 2 && older.length >= 2) ? computeRisk(recent, older) : null;

    const prevRecent = older;
    const prevOlder = entries.filter((e) => e.date <= format(subDays(today, 13), "yyyy-MM-dd") && e.date > format(subDays(today, 20), "yyyy-MM-dd"));
    const previousRisk = (prevRecent.length >= 2 && prevOlder.length >= 2) ? computeRisk(prevRecent, prevOlder) : null;

    const scores = computeWeeklyScores(entries, today);

    return { risk: currentRisk, prevRisk: previousRisk, weeklyScores: scores };
  }, [entries]);

  // Alert once per day when risk is high or elevated
  const alertedRef = useRef(false);
  useEffect(() => {
    if (!risk || alertedRef.current) return;
    if (risk.level === "high" || risk.level === "elevated") {
      const key = `relapse_risk_alert_${format(new Date(), "yyyy-MM-dd")}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        alertedRef.current = true;
        const isHigh = risk.level === "high";
        toast.warning(
          isHigh ? "🔴 High relapse risk detected" : "🔶 Elevated relapse risk",
          {
            description: isHigh
              ? "Multiple symptoms are worsening. Consider contacting your neurologist."
              : "Some symptoms are trending upward. Keep monitoring closely.",
            duration: 8000,
          }
        );
      }
    }
  }, [risk]);

  const [activeDot, setActiveDot] = useState<number | null>(null);

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

      {/* Mini sparkline with tap tooltips */}
      {weeklyScores.length >= 2 && (() => {
        const max = Math.max(...weeklyScores, 20);
        const lastScore = weeklyScores[weeklyScores.length - 1];
        const strokeColor =
          lastScore >= 60 ? "hsl(0, 72%, 51%)" :
          lastScore >= 35 ? "hsl(25, 85%, 50%)" :
          lastScore >= 15 ? "hsl(35, 80%, 50%)" : "hsl(145, 45%, 45%)";
        const weekLabels = weeklyScores.map((_, i) => {
          const weeksAgo = weeklyScores.length - 1 - i;
          return weeksAgo === 0 ? "This week" : weeksAgo === 1 ? "Last week" : `${weeksAgo}w ago`;
        });

        return (
          <div className="mb-2">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <svg
                  viewBox="0 0 120 54"
                  className="h-12 w-full max-w-[180px] cursor-pointer"
                  preserveAspectRatio="none"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = (e.clientX - rect.left) / rect.width;
                    let closest = 0;
                    let minDist = Infinity;
                    weeklyScores.forEach((_, i) => {
                      const dotX = i / (weeklyScores.length - 1);
                      const dist = Math.abs(clickX - dotX);
                      if (dist < minDist) { minDist = dist; closest = i; }
                    });
                    setActiveDot(activeDot === closest ? null : closest);
                  }}
                >
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <polygon
                    points={[
                      ...weeklyScores.map((s, i) => {
                        const x = (i / (weeklyScores.length - 1)) * 112 + 4;
                        const y = 34 - (s / max) * 28;
                        return `${x},${y}`;
                      }),
                      `${(weeklyScores.length - 1) / (weeklyScores.length - 1) * 112 + 4},38`,
                      `4,38`,
                    ].join(" ")}
                    fill="url(#sparkFill)"
                  />
                  {/* Line */}
                  <polyline
                    points={weeklyScores.map((s, i) => {
                      const x = (i / (weeklyScores.length - 1)) * 112 + 4;
                      const y = 34 - (s / max) * 28;
                      return `${x},${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {weeklyScores.map((s, i) => {
                    const x = (i / (weeklyScores.length - 1)) * 112 + 4;
                    const y = 34 - (s / max) * 28;
                    const isActive = activeDot === i;
                    const isCurrent = i === weeklyScores.length - 1;
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isActive ? 5 : isCurrent ? 4 : 3}
                          fill={isActive || isCurrent ? strokeColor : "hsl(var(--muted-foreground))"}
                          opacity={isActive || isCurrent ? 1 : 0.5}
                          className="transition-all duration-200"
                        />
                        <text
                          x={x}
                          y={50}
                          textAnchor="middle"
                          className="fill-muted-foreground"
                          style={{ fontSize: "8px" }}
                        >
                          {`W${i + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {activeDot !== null && activeDot < weeklyScores.length && (
                  <div
                    className="absolute -bottom-6 rounded bg-card border border-border px-1.5 py-0.5 shadow-md text-[9px] text-foreground font-medium whitespace-nowrap pointer-events-none z-10"
                    style={{
                      left: `${(activeDot / (weeklyScores.length - 1)) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {weekLabels[activeDot]} · {weeklyScores[activeDot]}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">4-week trend</span>
            </div>
          </div>
        );
      })()}

      {/* Week-over-week comparison */}
      {prevRisk && (
        <div className="flex items-center gap-1.5 mb-2 text-[11px]">
          {risk.score > prevRisk.score ? (
            <>
              <ArrowUp className="h-3 w-3 text-red-500 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400 font-medium">
                +{risk.score - prevRisk.score} pts vs last week
              </span>
            </>
          ) : risk.score < prevRisk.score ? (
            <>
              <ArrowDown className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {risk.score - prevRisk.score} pts vs last week
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
      )}

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

