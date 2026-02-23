import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, subWeeks, subDays } from "date-fns";
import { X, CalendarDays, Trophy, TrendingUp, TrendingDown, Minus, Shield } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEntriesInRange } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { useStreak } from "@/components/StreakBadge";
import { useWeekStreak } from "@/hooks/useWeekStreak";
import { useMedStreak } from "@/hooks/useMedStreak";
import { useRelapseFreeStreak } from "@/hooks/useRelapseFreeStreak";
import { computeRisk, computeWeeklyScores } from "@/components/relapse-risk/computeRisk";
import { RISK_CONFIG } from "@/components/relapse-risk/types";
import { Progress } from "@/components/ui/progress";

/* ── helpers ─────────────────────────────────────────────── */
function avg(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Severity scale: lower = better (fatigue, pain, etc.)
function scoreColor(v: number): string {
  if (v <= 3) return "text-emerald-600 dark:text-emerald-400";
  if (v <= 6) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function scoreBg(v: number): string {
  if (v <= 3) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (v <= 6) return "bg-amber-100 dark:bg-amber-900/40";
  return "bg-red-100 dark:bg-red-900/40";
}

// Sleep scale: higher = better
function sleepColor(hrs: number): string {
  if (hrs >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (hrs >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function sleepBg(hrs: number): string {
  if (hrs >= 7) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (hrs >= 5) return "bg-amber-100 dark:bg-amber-900/40";
  return "bg-red-100 dark:bg-red-900/40";
}

function motivation(logged: number, goal: number): string {
  if (logged === 0) return "A fresh start awaits — this week, let's log every day! 💫";
  const pct = logged / goal;
  if (pct >= 1) return `You crushed your ${goal}-day goal — incredible consistency! 🔥`;
  if (pct >= 0.7) return `${logged}/${goal} days — so close! Let's go all the way this week! ⚡`;
  if (pct >= 0.4) return `${logged}/${goal} days — every entry matters. Keep building the habit! 💪`;
  return `${logged}/${goal} days — a fresh week ahead. You've got this! 🌱`;
}

const SYMPTOMS = [
  { key: "fatigue"   as const, label: "Fatigue",   emoji: "🔋" },
  { key: "pain"      as const, label: "Pain",       emoji: "⚡" },
  { key: "brain_fog" as const, label: "Brain Fog",  emoji: "🌫️" },
  { key: "mood"      as const, label: "Mood",       emoji: "😊" },
  { key: "mobility"  as const, label: "Mobility",   emoji: "🚶" },
] as const;

/* ── component ───────────────────────────────────────────── */
const MondayRecapCard = () => {
  const navigate = useNavigate();
  // Only render on Mondays
  const isMonday = new Date().getDay() === 1;

  // Dismissal — keyed to this Monday so it reappears next Monday
  const thisMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const dismissKey = `recap_dismissed_${thisMonday}`;
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(dismissKey));

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  };

  // Last week's date range (Mon → Sun)
  const lastWeekStart = format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const lastWeekEnd   = format(endOfWeek(subWeeks(new Date(), 1),   { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Wider range for risk trend (need ~5 weeks of data for 4-week scores)
  const riskRangeStart = format(subDays(new Date(), 42), "yyyy-MM-dd");
  const riskRangeEnd   = format(new Date(), "yyyy-MM-dd");

  const { data: entries = [], isLoading: entriesLoading } = useEntriesInRange(lastWeekStart, lastWeekEnd);
  const { data: riskEntries = [] } = useEntriesInRange(riskRangeStart, riskRangeEnd);
  const { data: profile, isLoading: profileLoading }      = useProfile();

  const { streak: logStreak } = useStreak();
  const { weekStreak } = useWeekStreak();
  const medStreak = useMedStreak();
  const relapseStreak = useRelapseFreeStreak();

  const BADGE_TARGETS = useMemo(() => [
    { emoji: "⚡", name: "3-Day Logger", target: 3, current: logStreak },
    { emoji: "🔥", name: "Week Warrior", target: 7, current: logStreak },
    { emoji: "⭐", name: "Fortnight Focus", target: 14, current: logStreak },
    { emoji: "🏆", name: "Monthly Master", target: 30, current: logStreak },
    { emoji: "📊", name: "2-Week Goal", target: 2, current: weekStreak },
    { emoji: "🗓️", name: "Monthly Rhythm", target: 4, current: weekStreak },
    { emoji: "💊", name: "Med Week", target: 7, current: medStreak },
    { emoji: "💉", name: "Med Fortnight", target: 14, current: medStreak },
    { emoji: "🏅", name: "Med Month", target: 30, current: medStreak },
    { emoji: "🛡️", name: "30 Days Strong", target: 30, current: relapseStreak },
    { emoji: "💪", name: "60 Days Strong", target: 60, current: relapseStreak },
    { emoji: "🌟", name: "90 Days Strong", target: 90, current: relapseStreak },
  ], [logStreak, weekStreak, medStreak, relapseStreak]);

  const badgeProgress = useMemo(() => {
    const earned = BADGE_TARGETS.filter(b => b.current >= b.target);
    const upcoming = BADGE_TARGETS
      .filter(b => b.current < b.target && b.current / b.target >= 0.3)
      .sort((a, b) => (b.current / b.target) - (a.current / a.target))
      .slice(0, 2);
    return { earnedCount: earned.length, total: BADGE_TARGETS.length, upcoming };
  }, [BADGE_TARGETS]);

  const stats = useMemo(() => ({
    daysLogged:  entries.length,
    fatigue:     avg(entries.map(e => e.fatigue)),
    pain:        avg(entries.map(e => e.pain)),
    brain_fog:   avg(entries.map(e => e.brain_fog)),
    mood:        avg(entries.map(e => e.mood)),
    mobility:    avg(entries.map(e => e.mobility)),
    sleep_hours: avg(entries.map(e => e.sleep_hours)),
  }), [entries]);

  const riskSummary = useMemo(() => {
    const scores = computeWeeklyScores(riskEntries, new Date());
    if (scores.length < 2) return null;
    const current = scores[scores.length - 1];
    const prev = scores[scores.length - 2];
    const delta = current - prev;
    const level = current >= 60 ? "high" as const : current >= 35 ? "elevated" as const : current >= 15 ? "moderate" as const : "low" as const;
    const direction: "up" | "down" | "stable" = delta > 2 ? "up" : delta < -2 ? "down" : "stable";
    return { current, prev, delta, level, direction, weeks: scores.length };
  }, [riskEntries]);

  if (!isMonday || dismissed || entriesLoading || profileLoading) return null;

  const goal = profile?.weekly_log_goal ?? 7;
  const progressPct = Math.min((stats.daysLogged / goal) * 100, 100);
  const goalHit = stats.daysLogged >= goal;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Last Week Recap</p>
            <p className="text-[11px] text-muted-foreground">
              {format(new Date(lastWeekStart + "T00:00:00"), "MMM d")} – {format(new Date(lastWeekEnd + "T00:00:00"), "MMM d")}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
          aria-label="Dismiss recap"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Days logged + progress bar */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Days logged</span>
          <span className={`text-xs font-bold tabular-nums ${goalHit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
            {stats.daysLogged}/{goal}
            {goalHit && " ✓"}
          </span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
              goalHit ? "bg-emerald-500 dark:bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Symptom averages */}
      {entries.length > 0 && (
        <div className="px-4 py-2">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Avg Symptoms</p>
          <div className="grid grid-cols-3 gap-1.5">
            {SYMPTOMS.map(({ key, label, emoji }) => {
              const val = stats[key];
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center rounded-xl px-1 py-2 ${val !== null ? scoreBg(val) : "bg-muted/40"}`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className={`mt-1 text-sm font-bold tabular-nums leading-none ${val !== null ? scoreColor(val) : "text-muted-foreground"}`}>
                    {val !== null ? val.toFixed(1) : "–"}
                  </span>
                  <span className="mt-0.5 text-center text-[9px] leading-tight text-muted-foreground">{label}</span>
                </div>
              );
            })}
            {/* Sleep tile — inverted scale */}
            {(() => {
              const s = stats.sleep_hours;
              return (
                <div className={`flex flex-col items-center rounded-xl px-1 py-2 ${s !== null ? sleepBg(s) : "bg-muted/40"}`}>
                  <span className="text-base leading-none">💤</span>
                  <span className={`mt-1 text-sm font-bold tabular-nums leading-none ${s !== null ? sleepColor(s) : "text-muted-foreground"}`}>
                    {s !== null ? `${s.toFixed(1)}h` : "–"}
                  </span>
                  <span className="mt-0.5 text-center text-[9px] leading-tight text-muted-foreground">Sleep</span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Badge progress */}
      <button
        onClick={() => navigate("/badges")}
        className="mx-4 mb-2 flex w-[calc(100%-2rem)] items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5 text-left transition-all hover:bg-primary/10 active:scale-[0.98]"
      >
        <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">
              {badgeProgress.earnedCount}/{badgeProgress.total} badges
            </span>
            <span className="text-[10px] text-muted-foreground">View all →</span>
          </div>
          {badgeProgress.upcoming.length > 0 && (
            <div className="space-y-1">
              {badgeProgress.upcoming.map((b) => {
                const pct = Math.round((b.current / b.target) * 100);
                return (
                  <div key={b.name} className="flex items-center gap-2">
                    <span className="text-xs flex-shrink-0">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <Progress value={pct} className="h-1" />
                    </div>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0 tabular-nums">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </button>

      {/* Risk trend summary */}
      {riskSummary && (
        <Link
          to="/risk-history"
          className="mx-4 mb-2 flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 transition-all hover:bg-muted/50 active:scale-[0.98]"
        >
          {(() => {
            const cfg = RISK_CONFIG[riskSummary.level];
            const Icon = cfg.icon;
            const TrendIcon = riskSummary.direction === "up" ? TrendingUp : riskSummary.direction === "down" ? TrendingDown : Minus;
            const trendColor = riskSummary.direction === "up" ? "text-red-500" : riskSummary.direction === "down" ? "text-emerald-500" : "text-muted-foreground";
            const trendLabel = riskSummary.direction === "up" ? "Rising" : riskSummary.direction === "down" ? "Improving" : "Stable";
            return (
              <>
                <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-foreground">Relapse Risk</span>
                    <span className={`text-[10px] font-bold ${cfg.color}`}>{riskSummary.current}/100</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                    <span className={`text-[10px] font-medium ${trendColor}`}>
                      {trendLabel} ({riskSummary.delta > 0 ? "+" : ""}{riskSummary.delta} vs prior week)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">View →</span>
              </>
            );
          })()}
        </Link>
      )}

      {/* Motivational message */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {motivation(stats.daysLogged, goal)}
        </p>
      </div>
    </div>
  );
};

export default MondayRecapCard;
