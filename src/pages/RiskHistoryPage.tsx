import { useMemo, useCallback } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays, subWeeks } from "date-fns";
import { useRiskScores, RiskScore } from "@/hooks/useRiskScores";
import { useEntriesInRange } from "@/hooks/useEntries";
import { computeRisk } from "@/components/relapse-risk/computeRisk";
import { RISK_CONFIG, RiskLevel } from "@/components/relapse-risk/types";
import PageHeader from "@/components/PageHeader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeekPoint {
  week: string;
  label: string;
  score: number | null;
  level: RiskLevel | null;
}

function getLevelColor(level: RiskLevel | null): string {
  switch (level) {
    case "high": return "hsl(0, 72%, 51%)";
    case "elevated": return "hsl(25, 85%, 50%)";
    case "moderate": return "hsl(35, 80%, 50%)";
    default: return "hsl(145, 45%, 45%)";
  }
}

const WEEKS = 12;

export default function RiskHistoryPage() {
  const queryClient = useQueryClient();
  const { data: dbScores = [], isLoading: dbLoading } = useRiskScores(WEEKS);

  // Fallback: compute from entries if no DB scores yet
  const today = new Date();
  const start = format(subDays(today, WEEKS * 7 + 14), "yyyy-MM-dd");
  const end = format(today, "yyyy-MM-dd");
  const { data: entries = [], isLoading: entriesLoading } = useEntriesInRange(start, end);

  const isLoading = dbLoading || entriesLoading;

  const weeklyData = useMemo<WeekPoint[]>(() => {
    // Prefer DB scores if available
    if (dbScores.length > 0) {
      return dbScores.map((s: RiskScore) => ({
        week: format(new Date(s.week_start + "T00:00:00"), "MMM d"),
        label: `Week of ${format(new Date(s.week_start + "T00:00:00"), "MMM d")}`,
        score: s.score,
        level: s.level as RiskLevel,
      }));
    }

    // Fallback: compute from entries
    const points: WeekPoint[] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const weekEnd = subWeeks(today, w);
      const weekStart = subDays(weekEnd, 6);
      const olderEnd = subDays(weekStart, 1);
      const olderStart = subDays(olderEnd, 6);

      const recent = entries.filter(
        (e) => e.date >= format(weekStart, "yyyy-MM-dd") && e.date <= format(weekEnd, "yyyy-MM-dd")
      );
      const older = entries.filter(
        (e) => e.date >= format(olderStart, "yyyy-MM-dd") && e.date <= format(olderEnd, "yyyy-MM-dd")
      );

      const weekLabel = format(weekStart, "MMM d");

      if (recent.length >= 2 && older.length >= 2) {
        const result = computeRisk(recent, older);
        points.push({ week: weekLabel, label: `Week of ${weekLabel}`, score: result.score, level: result.level });
      } else {
        points.push({ week: weekLabel, label: `Week of ${weekLabel}`, score: null, level: null });
      }
    }
    return points;
  }, [dbScores, entries]);

  const validPoints = weeklyData.filter((p) => p.score !== null);
  const currentScore = validPoints.length > 0 ? validPoints[validPoints.length - 1].score! : null;
  const prevScore = validPoints.length > 1 ? validPoints[validPoints.length - 2].score! : null;
  const currentLevel = validPoints.length > 0 ? validPoints[validPoints.length - 1].level! : "low";

  const avgScore = validPoints.length > 0
    ? Math.round(validPoints.reduce((s, p) => s + p.score!, 0) / validPoints.length)
    : null;
  const maxScore = validPoints.length > 0 ? Math.max(...validPoints.map((p) => p.score!)) : null;
  const minScore = validPoints.length > 0 ? Math.min(...validPoints.map((p) => p.score!)) : null;

  const scoreDelta = currentScore !== null && prevScore !== null ? currentScore - prevScore : null;

  const cfg = RISK_CONFIG[currentLevel];
  const Icon = cfg.icon;

  // Monthly summaries
  const monthlySummaries = useMemo(() => {
    const months: Record<string, number[]> = {};
    for (const p of validPoints) {
      const monthKey = p.week.split(" ")[0];
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(p.score!);
    }
    return Object.entries(months).map(([month, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const level: RiskLevel = avg >= 60 ? "high" : avg >= 35 ? "elevated" : avg >= 15 ? "moderate" : "low";
      return { month, avg, level, weeks: scores.length };
    });
  }, [validPoints]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Risk History" subtitle="12-week relapse risk trends" showBack />

      <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ["risk-scores"] }); }} className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Current status card */}
        <section className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-5 w-5 ${cfg.color}`} aria-hidden="true" />
            <span className="font-semibold text-foreground">Current Risk</span>
            <span className={`ml-auto text-sm font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-3xl font-bold text-foreground">{currentScore ?? "—"}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            {scoreDelta !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${
                scoreDelta > 0 ? "text-red-500" : scoreDelta < 0 ? "text-emerald-500" : "text-muted-foreground"
              }`}>
                {scoreDelta > 0 ? <TrendingUp className="h-3 w-3" /> : scoreDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {scoreDelta > 0 ? "+" : ""}{scoreDelta} vs last week
              </span>
            )}
          </div>
        </section>

        {/* 12-week chart */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">12-Week Trend</h2>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : validPoints.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Not enough data yet — keep logging for at least 3 weeks.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData.filter((p) => p.score !== null)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getLevelColor(currentLevel)} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={getLevelColor(currentLevel)} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <ReferenceLine y={15} stroke="hsl(145, 45%, 45%)" strokeDasharray="4 4" strokeOpacity={0.5} />
                <ReferenceLine y={35} stroke="hsl(35, 80%, 50%)" strokeDasharray="4 4" strokeOpacity={0.5} />
                <ReferenceLine y={60} stroke="hsl(0, 72%, 51%)" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value}/100`, "Risk Score"]}
                  labelFormatter={(label: string) => `Week of ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={getLevelColor(currentLevel)}
                  strokeWidth={2.5}
                  fill="url(#riskGrad)"
                  dot={{ r: 3, fill: getLevelColor(currentLevel) }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 mt-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-emerald-500 rounded" /> Low (&lt;15)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-amber-500 rounded" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-orange-500 rounded" /> Elevated</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-red-500 rounded" /> High (60+)</span>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "Average", value: avgScore },
            { label: "Lowest", value: minScore },
            { label: "Highest", value: maxScore },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{value ?? "—"}</p>
            </div>
          ))}
        </section>

        {/* Monthly summaries */}
        {monthlySummaries.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Monthly Averages</h2>
            <div className="space-y-2">
              {monthlySummaries.map(({ month, avg, level, weeks }) => {
                const mCfg = RISK_CONFIG[level];
                return (
                  <div key={month} className={`flex items-center justify-between rounded-lg ${mCfg.bg} border ${mCfg.border} px-3 py-2`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{month}</span>
                      <span className="text-[10px] text-muted-foreground">({weeks}w)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${mCfg.color}`}>{avg}</span>
                      <span className={`text-[10px] font-medium ${mCfg.color}`}>{mCfg.emoji} {mCfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {dbScores.length > 0 && (
          <p className="text-center text-[9px] text-muted-foreground">
            Showing {dbScores.length} persisted weekly scores · not medical advice
          </p>
        )}
        {dbScores.length === 0 && (
          <p className="text-center text-[9px] text-muted-foreground">
            Based on 14-day rolling symptom trends · not medical advice
          </p>
        )}
      </PullToRefresh>
    </div>
  );
}
